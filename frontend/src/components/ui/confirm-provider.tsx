import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { ConfirmDialog, type ConfirmChoice, type FeatherName } from "./confirm-dialog";

/**
 * Cross-platform replacements for `Alert.alert`.
 *
 * `react-native-web` ships `Alert` as a no-op stub (`static alert() {}`), so a
 * prompt built on it renders on web but does nothing — the button that opened
 * it just looks dead. These three helpers cover every shape the app used
 * `Alert` for, and all of them go through the shared `ConfirmDialog`, so a
 * prompt looks and behaves the same on iOS, Android and the web.
 *
 * Every helper returns a promise so callers read linearly instead of nesting
 * their work inside a button's `onPress`:
 *
 * ```ts
 * if (!(await confirm({ title: "Sign out", destructive: true }))) return;
 * await signOut();
 * ```
 */

type ConfirmOptions = {
  title: string;
  message?: string;
  icon?: FeatherName;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Paints the confirm button in the danger red. */
  destructive?: boolean;
};

type AlertOptions = {
  title: string;
  message?: string;
  icon?: FeatherName;
  okLabel?: string;
  destructive?: boolean;
};

type ChooseOptions = {
  title: string;
  message?: string;
  icon?: FeatherName;
  cancelLabel?: string;
  choices: ConfirmChoice[];
};

type ConfirmContextValue = {
  /** Two-button prompt. Resolves `true` only when the user confirms. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Single-button notice. Resolves once acknowledged. */
  alert: (options: AlertOptions) => Promise<void>;
  /** Action sheet. Resolves the chosen label, or `null` if dismissed. */
  choose: (options: ChooseOptions) => Promise<string | null>;
};

type PromptKind = "alert" | "confirm" | "choose";

/** What each kind hands back when the user backs out instead of answering. */
const CANCELLED = {
  alert: undefined,
  confirm: false,
  choose: null,
} as const;

/**
 * One queued prompt.
 *
 * `options` is the union of the three shapes flattened to their optional fields
 * — the dialog reads whichever ones the current kind actually uses, so it can
 * stay a single declarative element instead of three.
 */
type PendingRequest = {
  kind: PromptKind;
  options: { title: string } & Partial<
    AlertOptions & ConfirmOptions & ChooseOptions
  >;
  settle: (value: never) => void;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * Owns the single dialog instance.
 *
 * Requests queue rather than replace one another: a screen can fire two
 * prompts in quick succession (a confirm whose action then fails and reports an
 * alert) and the second must wait for the first to be answered, otherwise its
 * promise would be dropped and never settle.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<PendingRequest | null>(null);

  // Mirrors `active` so a request can be answered from an event handler without
  // reading it back out of state. Settling happens outside the `setState`
  // updater on purpose — updaters must stay pure, and React may run one twice.
  const activeRef = useRef<PendingRequest | null>(null);
  const queue = useRef<PendingRequest[]>([]);

  const show = useCallback((request: PendingRequest | null) => {
    activeRef.current = request;
    setActive(request);
  }, []);

  const enqueue = useCallback(
    <T,>(kind: PromptKind, options: Omit<PendingRequest["options"], "title"> & { title: string }) =>
      new Promise<T>((resolve) => {
        queue.current.push({
          kind,
          options,
          settle: resolve as PendingRequest["settle"],
        });

        // Nothing is on screen yet on the very first request, so start the
        // pump; later requests queue behind whatever is already showing.
        if (activeRef.current === null) {
          show(queue.current.shift() ?? null);
        }
      }),
    [show],
  );

  /** Answer the visible request, then pull the next queued one forward. */
  const answer = useCallback(
    (value: boolean | string | null | undefined) => {
      const current = activeRef.current;

      if (current !== null) {
        activeRef.current = null;
        (current.settle as (value: unknown) => void)(value);
      }

      show(queue.current.shift() ?? null);
    },
    [show],
  );

  const cancel = useCallback(() => {
    const current = activeRef.current;
    answer(current === null ? undefined : CANCELLED[current.kind]);
  }, [answer]);

  // Nothing should be left pending behind an unmounted provider — the promise
  // would otherwise never settle and the caller's `await` would hang.
  useEffect(() => {
    return () => {
      for (const request of queue.current) {
        (request.settle as (value: unknown) => void)(CANCELLED[request.kind]);
      }
      queue.current = [];
    };
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) => enqueue<boolean>("confirm", options),
    [enqueue],
  );

  const alert = useCallback(
    (options: AlertOptions) => enqueue<void>("alert", options),
    [enqueue],
  );

  const choose = useCallback(
    (options: ChooseOptions) => enqueue<string | null>("choose", options),
    [enqueue],
  );

  const options = active?.options;

  return (
    <ConfirmContext value={{ confirm, alert, choose }}>
      {children}

      <ConfirmDialog
        visible={active !== null}
        title={options?.title ?? ""}
        message={options?.message}
        icon={options?.icon}
        cancelLabel={active?.kind === "alert" ? undefined : (options?.cancelLabel ?? "Cancel")}
        confirmLabel={
          active?.kind === "alert" ? (options?.okLabel ?? "OK") : (options?.confirmLabel ?? "Confirm")
        }
        choices={active?.kind === "choose" ? options?.choices : undefined}
        onChoice={(label) => {
          answer(label);
        }}
        destructive={options?.destructive === true}
        onConfirm={() => {
          answer(true);
        }}
        onCancel={cancel}
      />
    </ConfirmContext>
  );
}

/**
 * Throws when used outside the provider — a missing provider is a wiring bug,
 * not a state to render around.
 */
export function useConfirm(): ConfirmContextValue {
  const context = use(ConfirmContext);

  if (context === null) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }

  return context;
}
