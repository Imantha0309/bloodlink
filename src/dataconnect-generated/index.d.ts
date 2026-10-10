import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export enum BloodComponent {
  whole_blood = "whole_blood",
  prbc = "prbc",
  platelets = "platelets",
  plasma = "plasma",
};

export enum DonorResponse {
  accepted = "accepted",
  declined = "declined",
};

export enum RequestStatus {
  pending = "pending",
  verified = "verified",
  fulfilled = "fulfilled",
  cancelled = "cancelled",
};

export enum UrgencyLevel {
  critical = "critical",
  urgent = "urgent",
  standard = "standard",
};

export enum UserRole {
  recipient = "recipient",
  donor = "donor",
  hospital = "hospital",
  admin = "admin",
};



export interface Alert_Key {
  id: UUIDString;
  __typename?: 'Alert_Key';
}

export interface BloodBank_Key {
  id: UUIDString;
  __typename?: 'BloodBank_Key';
}

export interface BloodInventory_Key {
  id: UUIDString;
  __typename?: 'BloodInventory_Key';
}

export interface CompleteDonationCaseData {
  first?: unknown | null;
  second?: number | null;
}

export interface CompleteDonationCaseVariables {
  requestId: UUIDString;
}

export interface CompleteExtractionData {
  extraction?: unknown | null;
}

export interface CompleteExtractionVariables {
  requestId: UUIDString;
  volumeMl?: number | null;
  phlebotomistName?: string | null;
}

export interface CreateDonorCheckInTicketData {
  ticket?: unknown | null;
}

export interface CreateDonorCheckInTicketVariables {
  requestId: UUIDString;
  tokenHash: string;
}

export interface CreateEmergencyRequestAsUserData {
  request?: unknown | null;
}

export interface CreateEmergencyRequestAsUserVariables {
  patientName: string;
  bloodGroup: string;
  units: number;
  hospital: string;
  district?: string | null;
  registrationNumber?: string | null;
  contactName: string;
  contactMobile: string;
  urgency: UrgencyLevel;
  notes?: string | null;
}

export interface CreateEmergencyRequestData {
  request?: unknown | null;
}

export interface CreateEmergencyRequestVariables {
  patientName: string;
  bloodGroup: string;
  units: number;
  hospital: string;
  district?: string | null;
  registrationNumber?: string | null;
  contactName: string;
  contactMobile: string;
  urgency: UrgencyLevel;
  notes?: string | null;
}

export interface DeleteDonorAvailabilityData {
  deleted?: unknown | null;
}

export interface DeleteDonorResponseData {
  deleted?: unknown | null;
}

export interface DeleteDonorResponseVariables {
  requestId: UUIDString;
}

export interface DonorAvailability_Key {
  userId: string;
  __typename?: 'DonorAvailability_Key';
}

export interface DonorRequestResponse_Key {
  id: UUIDString;
  __typename?: 'DonorRequestResponse_Key';
}

export interface DonorScreening_Key {
  id: UUIDString;
  __typename?: 'DonorScreening_Key';
}

export interface EmergencyRequest_Key {
  id: UUIDString;
  __typename?: 'EmergencyRequest_Key';
}

export interface ExtractionSession_Key {
  id: UUIDString;
  __typename?: 'ExtractionSession_Key';
}

export interface GetActiveDonorStatsData {
  donors?: unknown[] | null;
}

export interface GetBloodBankData {
  bank?: unknown | null;
}

export interface GetBloodBankVariables {
  id: UUIDString;
}

export interface GetDashboardSummaryData {
  summary?: unknown | null;
}

export interface GetDonorAvailabilityData {
  availability?: unknown[] | null;
}

export interface GetDonorCommitmentData {
  commitment?: unknown | null;
}

export interface GetDonorCommitmentVariables {
  requestId: UUIDString;
}

export interface GetEmergencyRequestData {
  request?: unknown | null;
}

export interface GetEmergencyRequestVariables {
  id: UUIDString;
}

export interface GetHospitalInventoryData {
  banks?: unknown[] | null;
}

export interface GetMeData {
  me?: {
    uid: string;
    role: UserRole;
    fullName: string;
    email?: string | null;
    mobile?: string | null;
    district?: string | null;
    bloodGroup?: string | null;
    isVerified: boolean;
  } & User_Key;
}

export interface GetRequestCandidatesData {
  candidates?: unknown | null;
}

export interface GetRequestCandidatesVariables {
  requestId: UUIDString;
}

export interface GetRequestWorkflowData {
  workflow?: unknown | null;
}

export interface GetRequestWorkflowVariables {
  requestId: UUIDString;
}

export interface ListAlertsData {
  feed?: unknown | null;
}

export interface ListBloodBanksData {
  banks?: unknown[] | null;
}

export interface ListDonorCommitmentsData {
  commitments?: unknown[] | null;
}

export interface ListDonorFeedData {
  requests?: unknown[] | null;
}

export interface ListDonorResponsesData {
  responses?: unknown[] | null;
}

export interface ListMyRequestsData {
  requests?: unknown[] | null;
}

export interface ListTriageQueueData {
  requests?: unknown[] | null;
}

export interface MarkAlertsReadData {
  updated?: number | null;
}

export interface MarkAlertsReadVariables {
  ids?: string | null;
}

export interface RegisterUserData {
  created?: unknown | null;
  availability?: number | null;
}

export interface RegisterUserVariables {
  role: UserRole;
  fullName: string;
  district?: string | null;
  bloodGroup?: string | null;
  registrationNumber?: string | null;
  lastDonationAt?: TimestampString | null;
  email?: string | null;
  mobile?: string | null;
}

export interface RespondToRequestData {
  created?: unknown | null;
  alert?: number | null;
}

export interface RespondToRequestVariables {
  requestId: UUIDString;
  response: DonorResponse;
}

export interface SearchDonorDirectoryData {
  donors?: unknown[] | null;
}

export interface SearchDonorDirectoryVariables {
  bloodGroup?: string | null;
  district?: string | null;
}

export interface SetDonorAvailabilityData {
  availability?: unknown | null;
}

export interface SetDonorAvailabilityVariables {
  isAvailable: boolean;
  lastDonationAt?: TimestampString | null;
  hasLastDonation: boolean;
}

export interface StartDonorTransitData {
  updated?: unknown | null;
}

export interface StartDonorTransitVariables {
  requestId: UUIDString;
}

export interface StartExtractionData {
  extraction?: unknown | null;
}

export interface StartExtractionVariables {
  requestId: UUIDString;
}

export interface SubmitScreeningData {
  screening?: unknown | null;
}

export interface SubmitScreeningVariables {
  requestId: UUIDString;
  temperature?: string | null;
  bloodPressure?: string | null;
  pulse?: string | null;
  hemoglobin?: string | null;
  eligible: boolean;
  bedLabel?: string | null;
}

export interface UpdateDonorProfileData {
  dup?: {
    users: ({
      uid: string;
    } & User_Key)[];
  };
    updated?: unknown | null;
}

export interface UpdateDonorProfileVariables {
  fullName: string;
  email?: string | null;
  mobile?: string | null;
  district?: string | null;
  bloodGroup?: string | null;
}

export interface UpdateDonorResponseData {
  updated?: unknown | null;
}

export interface UpdateDonorResponseVariables {
  requestId: UUIDString;
  response: DonorResponse;
}

export interface UpdateInventoryItemData {
  inventory?: unknown | null;
}

export interface UpdateInventoryItemVariables {
  bankId: UUIDString;
  bloodGroup: string;
  component: BloodComponent;
  units: number;
}

export interface UpdatePushTokenData {
  updated?: number | null;
}

export interface UpdatePushTokenVariables {
  token: string;
}

export interface UpdateRecipientDistrictData {
  updated?: unknown | null;
}

export interface UpdateRecipientDistrictVariables {
  district?: string | null;
}

export interface UpdateRequestStatusData {
  updated?: unknown | null;
  notifyCompatibleDonors?: number | null;
  notifyRequester?: number | null;
  notifyDonor?: number | null;
}

export interface UpdateRequestStatusVariables {
  requestId: UUIDString;
  status: RequestStatus;
}

export interface User_Key {
  uid: string;
  __typename?: 'User_Key';
}

export interface VerifyDonorCheckInData {
  verified?: unknown | null;
}

export interface VerifyDonorCheckInVariables {
  requestId: UUIDString;
  tokenHash: string;
}

interface CreateEmergencyRequestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEmergencyRequestVariables): MutationRef<CreateEmergencyRequestData, CreateEmergencyRequestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateEmergencyRequestVariables): MutationRef<CreateEmergencyRequestData, CreateEmergencyRequestVariables>;
  operationName: string;
}
export const createEmergencyRequestRef: CreateEmergencyRequestRef;

export function createEmergencyRequest(vars: CreateEmergencyRequestVariables): MutationPromise<CreateEmergencyRequestData, CreateEmergencyRequestVariables>;
export function createEmergencyRequest(dc: DataConnect, vars: CreateEmergencyRequestVariables): MutationPromise<CreateEmergencyRequestData, CreateEmergencyRequestVariables>;

interface CreateEmergencyRequestAsUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEmergencyRequestAsUserVariables): MutationRef<CreateEmergencyRequestAsUserData, CreateEmergencyRequestAsUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateEmergencyRequestAsUserVariables): MutationRef<CreateEmergencyRequestAsUserData, CreateEmergencyRequestAsUserVariables>;
  operationName: string;
}
export const createEmergencyRequestAsUserRef: CreateEmergencyRequestAsUserRef;

export function createEmergencyRequestAsUser(vars: CreateEmergencyRequestAsUserVariables): MutationPromise<CreateEmergencyRequestAsUserData, CreateEmergencyRequestAsUserVariables>;
export function createEmergencyRequestAsUser(dc: DataConnect, vars: CreateEmergencyRequestAsUserVariables): MutationPromise<CreateEmergencyRequestAsUserData, CreateEmergencyRequestAsUserVariables>;

interface UpdateRequestStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateRequestStatusVariables): MutationRef<UpdateRequestStatusData, UpdateRequestStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateRequestStatusVariables): MutationRef<UpdateRequestStatusData, UpdateRequestStatusVariables>;
  operationName: string;
}
export const updateRequestStatusRef: UpdateRequestStatusRef;

export function updateRequestStatus(vars: UpdateRequestStatusVariables): MutationPromise<UpdateRequestStatusData, UpdateRequestStatusVariables>;
export function updateRequestStatus(dc: DataConnect, vars: UpdateRequestStatusVariables): MutationPromise<UpdateRequestStatusData, UpdateRequestStatusVariables>;

interface RegisterUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegisterUserVariables): MutationRef<RegisterUserData, RegisterUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RegisterUserVariables): MutationRef<RegisterUserData, RegisterUserVariables>;
  operationName: string;
}
export const registerUserRef: RegisterUserRef;

export function registerUser(vars: RegisterUserVariables): MutationPromise<RegisterUserData, RegisterUserVariables>;
export function registerUser(dc: DataConnect, vars: RegisterUserVariables): MutationPromise<RegisterUserData, RegisterUserVariables>;

interface UpdateDonorProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDonorProfileVariables): MutationRef<UpdateDonorProfileData, UpdateDonorProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateDonorProfileVariables): MutationRef<UpdateDonorProfileData, UpdateDonorProfileVariables>;
  operationName: string;
}
export const updateDonorProfileRef: UpdateDonorProfileRef;

export function updateDonorProfile(vars: UpdateDonorProfileVariables): MutationPromise<UpdateDonorProfileData, UpdateDonorProfileVariables>;
export function updateDonorProfile(dc: DataConnect, vars: UpdateDonorProfileVariables): MutationPromise<UpdateDonorProfileData, UpdateDonorProfileVariables>;

interface UpdateRecipientDistrictRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: UpdateRecipientDistrictVariables): MutationRef<UpdateRecipientDistrictData, UpdateRecipientDistrictVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: UpdateRecipientDistrictVariables): MutationRef<UpdateRecipientDistrictData, UpdateRecipientDistrictVariables>;
  operationName: string;
}
export const updateRecipientDistrictRef: UpdateRecipientDistrictRef;

export function updateRecipientDistrict(vars?: UpdateRecipientDistrictVariables): MutationPromise<UpdateRecipientDistrictData, UpdateRecipientDistrictVariables>;
export function updateRecipientDistrict(dc: DataConnect, vars?: UpdateRecipientDistrictVariables): MutationPromise<UpdateRecipientDistrictData, UpdateRecipientDistrictVariables>;

interface RespondToRequestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RespondToRequestVariables): MutationRef<RespondToRequestData, RespondToRequestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RespondToRequestVariables): MutationRef<RespondToRequestData, RespondToRequestVariables>;
  operationName: string;
}
export const respondToRequestRef: RespondToRequestRef;

export function respondToRequest(vars: RespondToRequestVariables): MutationPromise<RespondToRequestData, RespondToRequestVariables>;
export function respondToRequest(dc: DataConnect, vars: RespondToRequestVariables): MutationPromise<RespondToRequestData, RespondToRequestVariables>;

interface UpdateDonorResponseRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateDonorResponseVariables): MutationRef<UpdateDonorResponseData, UpdateDonorResponseVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateDonorResponseVariables): MutationRef<UpdateDonorResponseData, UpdateDonorResponseVariables>;
  operationName: string;
}
export const updateDonorResponseRef: UpdateDonorResponseRef;

export function updateDonorResponse(vars: UpdateDonorResponseVariables): MutationPromise<UpdateDonorResponseData, UpdateDonorResponseVariables>;
export function updateDonorResponse(dc: DataConnect, vars: UpdateDonorResponseVariables): MutationPromise<UpdateDonorResponseData, UpdateDonorResponseVariables>;

interface DeleteDonorResponseRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteDonorResponseVariables): MutationRef<DeleteDonorResponseData, DeleteDonorResponseVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteDonorResponseVariables): MutationRef<DeleteDonorResponseData, DeleteDonorResponseVariables>;
  operationName: string;
}
export const deleteDonorResponseRef: DeleteDonorResponseRef;

export function deleteDonorResponse(vars: DeleteDonorResponseVariables): MutationPromise<DeleteDonorResponseData, DeleteDonorResponseVariables>;
export function deleteDonorResponse(dc: DataConnect, vars: DeleteDonorResponseVariables): MutationPromise<DeleteDonorResponseData, DeleteDonorResponseVariables>;

interface SetDonorAvailabilityRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetDonorAvailabilityVariables): MutationRef<SetDonorAvailabilityData, SetDonorAvailabilityVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetDonorAvailabilityVariables): MutationRef<SetDonorAvailabilityData, SetDonorAvailabilityVariables>;
  operationName: string;
}
export const setDonorAvailabilityRef: SetDonorAvailabilityRef;

export function setDonorAvailability(vars: SetDonorAvailabilityVariables): MutationPromise<SetDonorAvailabilityData, SetDonorAvailabilityVariables>;
export function setDonorAvailability(dc: DataConnect, vars: SetDonorAvailabilityVariables): MutationPromise<SetDonorAvailabilityData, SetDonorAvailabilityVariables>;

interface DeleteDonorAvailabilityRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteDonorAvailabilityData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteDonorAvailabilityData, undefined>;
  operationName: string;
}
export const deleteDonorAvailabilityRef: DeleteDonorAvailabilityRef;

export function deleteDonorAvailability(): MutationPromise<DeleteDonorAvailabilityData, undefined>;
export function deleteDonorAvailability(dc: DataConnect): MutationPromise<DeleteDonorAvailabilityData, undefined>;

interface StartDonorTransitRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: StartDonorTransitVariables): MutationRef<StartDonorTransitData, StartDonorTransitVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: StartDonorTransitVariables): MutationRef<StartDonorTransitData, StartDonorTransitVariables>;
  operationName: string;
}
export const startDonorTransitRef: StartDonorTransitRef;

export function startDonorTransit(vars: StartDonorTransitVariables): MutationPromise<StartDonorTransitData, StartDonorTransitVariables>;
export function startDonorTransit(dc: DataConnect, vars: StartDonorTransitVariables): MutationPromise<StartDonorTransitData, StartDonorTransitVariables>;

interface CreateDonorCheckInTicketRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateDonorCheckInTicketVariables): MutationRef<CreateDonorCheckInTicketData, CreateDonorCheckInTicketVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateDonorCheckInTicketVariables): MutationRef<CreateDonorCheckInTicketData, CreateDonorCheckInTicketVariables>;
  operationName: string;
}
export const createDonorCheckInTicketRef: CreateDonorCheckInTicketRef;

export function createDonorCheckInTicket(vars: CreateDonorCheckInTicketVariables): MutationPromise<CreateDonorCheckInTicketData, CreateDonorCheckInTicketVariables>;
export function createDonorCheckInTicket(dc: DataConnect, vars: CreateDonorCheckInTicketVariables): MutationPromise<CreateDonorCheckInTicketData, CreateDonorCheckInTicketVariables>;

interface VerifyDonorCheckInRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: VerifyDonorCheckInVariables): MutationRef<VerifyDonorCheckInData, VerifyDonorCheckInVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: VerifyDonorCheckInVariables): MutationRef<VerifyDonorCheckInData, VerifyDonorCheckInVariables>;
  operationName: string;
}
export const verifyDonorCheckInRef: VerifyDonorCheckInRef;

export function verifyDonorCheckIn(vars: VerifyDonorCheckInVariables): MutationPromise<VerifyDonorCheckInData, VerifyDonorCheckInVariables>;
export function verifyDonorCheckIn(dc: DataConnect, vars: VerifyDonorCheckInVariables): MutationPromise<VerifyDonorCheckInData, VerifyDonorCheckInVariables>;

interface SubmitScreeningRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SubmitScreeningVariables): MutationRef<SubmitScreeningData, SubmitScreeningVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SubmitScreeningVariables): MutationRef<SubmitScreeningData, SubmitScreeningVariables>;
  operationName: string;
}
export const submitScreeningRef: SubmitScreeningRef;

export function submitScreening(vars: SubmitScreeningVariables): MutationPromise<SubmitScreeningData, SubmitScreeningVariables>;
export function submitScreening(dc: DataConnect, vars: SubmitScreeningVariables): MutationPromise<SubmitScreeningData, SubmitScreeningVariables>;

interface StartExtractionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: StartExtractionVariables): MutationRef<StartExtractionData, StartExtractionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: StartExtractionVariables): MutationRef<StartExtractionData, StartExtractionVariables>;
  operationName: string;
}
export const startExtractionRef: StartExtractionRef;

export function startExtraction(vars: StartExtractionVariables): MutationPromise<StartExtractionData, StartExtractionVariables>;
export function startExtraction(dc: DataConnect, vars: StartExtractionVariables): MutationPromise<StartExtractionData, StartExtractionVariables>;

interface CompleteExtractionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CompleteExtractionVariables): MutationRef<CompleteExtractionData, CompleteExtractionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CompleteExtractionVariables): MutationRef<CompleteExtractionData, CompleteExtractionVariables>;
  operationName: string;
}
export const completeExtractionRef: CompleteExtractionRef;

export function completeExtraction(vars: CompleteExtractionVariables): MutationPromise<CompleteExtractionData, CompleteExtractionVariables>;
export function completeExtraction(dc: DataConnect, vars: CompleteExtractionVariables): MutationPromise<CompleteExtractionData, CompleteExtractionVariables>;

interface CompleteDonationCaseRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CompleteDonationCaseVariables): MutationRef<CompleteDonationCaseData, CompleteDonationCaseVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CompleteDonationCaseVariables): MutationRef<CompleteDonationCaseData, CompleteDonationCaseVariables>;
  operationName: string;
}
export const completeDonationCaseRef: CompleteDonationCaseRef;

export function completeDonationCase(vars: CompleteDonationCaseVariables): MutationPromise<CompleteDonationCaseData, CompleteDonationCaseVariables>;
export function completeDonationCase(dc: DataConnect, vars: CompleteDonationCaseVariables): MutationPromise<CompleteDonationCaseData, CompleteDonationCaseVariables>;

interface UpdateInventoryItemRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateInventoryItemVariables): MutationRef<UpdateInventoryItemData, UpdateInventoryItemVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateInventoryItemVariables): MutationRef<UpdateInventoryItemData, UpdateInventoryItemVariables>;
  operationName: string;
}
export const updateInventoryItemRef: UpdateInventoryItemRef;

export function updateInventoryItem(vars: UpdateInventoryItemVariables): MutationPromise<UpdateInventoryItemData, UpdateInventoryItemVariables>;
export function updateInventoryItem(dc: DataConnect, vars: UpdateInventoryItemVariables): MutationPromise<UpdateInventoryItemData, UpdateInventoryItemVariables>;

interface UpdatePushTokenRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePushTokenVariables): MutationRef<UpdatePushTokenData, UpdatePushTokenVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdatePushTokenVariables): MutationRef<UpdatePushTokenData, UpdatePushTokenVariables>;
  operationName: string;
}
export const updatePushTokenRef: UpdatePushTokenRef;

export function updatePushToken(vars: UpdatePushTokenVariables): MutationPromise<UpdatePushTokenData, UpdatePushTokenVariables>;
export function updatePushToken(dc: DataConnect, vars: UpdatePushTokenVariables): MutationPromise<UpdatePushTokenData, UpdatePushTokenVariables>;

interface MarkAlertsReadRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: MarkAlertsReadVariables): MutationRef<MarkAlertsReadData, MarkAlertsReadVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: MarkAlertsReadVariables): MutationRef<MarkAlertsReadData, MarkAlertsReadVariables>;
  operationName: string;
}
export const markAlertsReadRef: MarkAlertsReadRef;

export function markAlertsRead(vars?: MarkAlertsReadVariables): MutationPromise<MarkAlertsReadData, MarkAlertsReadVariables>;
export function markAlertsRead(dc: DataConnect, vars?: MarkAlertsReadVariables): MutationPromise<MarkAlertsReadData, MarkAlertsReadVariables>;

interface GetMeRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMeData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMeData, undefined>;
  operationName: string;
}
export const getMeRef: GetMeRef;

export function getMe(options?: ExecuteQueryOptions): QueryPromise<GetMeData, undefined>;
export function getMe(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMeData, undefined>;

interface ListBloodBanksRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListBloodBanksData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListBloodBanksData, undefined>;
  operationName: string;
}
export const listBloodBanksRef: ListBloodBanksRef;

export function listBloodBanks(options?: ExecuteQueryOptions): QueryPromise<ListBloodBanksData, undefined>;
export function listBloodBanks(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListBloodBanksData, undefined>;

interface GetBloodBankRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetBloodBankVariables): QueryRef<GetBloodBankData, GetBloodBankVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetBloodBankVariables): QueryRef<GetBloodBankData, GetBloodBankVariables>;
  operationName: string;
}
export const getBloodBankRef: GetBloodBankRef;

export function getBloodBank(vars: GetBloodBankVariables, options?: ExecuteQueryOptions): QueryPromise<GetBloodBankData, GetBloodBankVariables>;
export function getBloodBank(dc: DataConnect, vars: GetBloodBankVariables, options?: ExecuteQueryOptions): QueryPromise<GetBloodBankData, GetBloodBankVariables>;

interface GetActiveDonorStatsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetActiveDonorStatsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetActiveDonorStatsData, undefined>;
  operationName: string;
}
export const getActiveDonorStatsRef: GetActiveDonorStatsRef;

export function getActiveDonorStats(options?: ExecuteQueryOptions): QueryPromise<GetActiveDonorStatsData, undefined>;
export function getActiveDonorStats(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetActiveDonorStatsData, undefined>;

interface GetEmergencyRequestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetEmergencyRequestVariables): QueryRef<GetEmergencyRequestData, GetEmergencyRequestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetEmergencyRequestVariables): QueryRef<GetEmergencyRequestData, GetEmergencyRequestVariables>;
  operationName: string;
}
export const getEmergencyRequestRef: GetEmergencyRequestRef;

export function getEmergencyRequest(vars: GetEmergencyRequestVariables, options?: ExecuteQueryOptions): QueryPromise<GetEmergencyRequestData, GetEmergencyRequestVariables>;
export function getEmergencyRequest(dc: DataConnect, vars: GetEmergencyRequestVariables, options?: ExecuteQueryOptions): QueryPromise<GetEmergencyRequestData, GetEmergencyRequestVariables>;

interface ListMyRequestsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyRequestsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMyRequestsData, undefined>;
  operationName: string;
}
export const listMyRequestsRef: ListMyRequestsRef;

export function listMyRequests(options?: ExecuteQueryOptions): QueryPromise<ListMyRequestsData, undefined>;
export function listMyRequests(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyRequestsData, undefined>;

interface ListDonorFeedRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListDonorFeedData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListDonorFeedData, undefined>;
  operationName: string;
}
export const listDonorFeedRef: ListDonorFeedRef;

export function listDonorFeed(options?: ExecuteQueryOptions): QueryPromise<ListDonorFeedData, undefined>;
export function listDonorFeed(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListDonorFeedData, undefined>;

interface ListTriageQueueRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListTriageQueueData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListTriageQueueData, undefined>;
  operationName: string;
}
export const listTriageQueueRef: ListTriageQueueRef;

export function listTriageQueue(options?: ExecuteQueryOptions): QueryPromise<ListTriageQueueData, undefined>;
export function listTriageQueue(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListTriageQueueData, undefined>;

interface ListDonorCommitmentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListDonorCommitmentsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListDonorCommitmentsData, undefined>;
  operationName: string;
}
export const listDonorCommitmentsRef: ListDonorCommitmentsRef;

export function listDonorCommitments(options?: ExecuteQueryOptions): QueryPromise<ListDonorCommitmentsData, undefined>;
export function listDonorCommitments(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListDonorCommitmentsData, undefined>;

interface ListDonorResponsesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListDonorResponsesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListDonorResponsesData, undefined>;
  operationName: string;
}
export const listDonorResponsesRef: ListDonorResponsesRef;

export function listDonorResponses(options?: ExecuteQueryOptions): QueryPromise<ListDonorResponsesData, undefined>;
export function listDonorResponses(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListDonorResponsesData, undefined>;

interface GetDonorAvailabilityRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetDonorAvailabilityData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetDonorAvailabilityData, undefined>;
  operationName: string;
}
export const getDonorAvailabilityRef: GetDonorAvailabilityRef;

export function getDonorAvailability(options?: ExecuteQueryOptions): QueryPromise<GetDonorAvailabilityData, undefined>;
export function getDonorAvailability(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetDonorAvailabilityData, undefined>;

interface SearchDonorDirectoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: SearchDonorDirectoryVariables): QueryRef<SearchDonorDirectoryData, SearchDonorDirectoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: SearchDonorDirectoryVariables): QueryRef<SearchDonorDirectoryData, SearchDonorDirectoryVariables>;
  operationName: string;
}
export const searchDonorDirectoryRef: SearchDonorDirectoryRef;

export function searchDonorDirectory(vars?: SearchDonorDirectoryVariables, options?: ExecuteQueryOptions): QueryPromise<SearchDonorDirectoryData, SearchDonorDirectoryVariables>;
export function searchDonorDirectory(dc: DataConnect, vars?: SearchDonorDirectoryVariables, options?: ExecuteQueryOptions): QueryPromise<SearchDonorDirectoryData, SearchDonorDirectoryVariables>;

interface GetHospitalInventoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetHospitalInventoryData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetHospitalInventoryData, undefined>;
  operationName: string;
}
export const getHospitalInventoryRef: GetHospitalInventoryRef;

export function getHospitalInventory(options?: ExecuteQueryOptions): QueryPromise<GetHospitalInventoryData, undefined>;
export function getHospitalInventory(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetHospitalInventoryData, undefined>;

interface GetRequestCandidatesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetRequestCandidatesVariables): QueryRef<GetRequestCandidatesData, GetRequestCandidatesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetRequestCandidatesVariables): QueryRef<GetRequestCandidatesData, GetRequestCandidatesVariables>;
  operationName: string;
}
export const getRequestCandidatesRef: GetRequestCandidatesRef;

export function getRequestCandidates(vars: GetRequestCandidatesVariables, options?: ExecuteQueryOptions): QueryPromise<GetRequestCandidatesData, GetRequestCandidatesVariables>;
export function getRequestCandidates(dc: DataConnect, vars: GetRequestCandidatesVariables, options?: ExecuteQueryOptions): QueryPromise<GetRequestCandidatesData, GetRequestCandidatesVariables>;

interface GetRequestWorkflowRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetRequestWorkflowVariables): QueryRef<GetRequestWorkflowData, GetRequestWorkflowVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetRequestWorkflowVariables): QueryRef<GetRequestWorkflowData, GetRequestWorkflowVariables>;
  operationName: string;
}
export const getRequestWorkflowRef: GetRequestWorkflowRef;

export function getRequestWorkflow(vars: GetRequestWorkflowVariables, options?: ExecuteQueryOptions): QueryPromise<GetRequestWorkflowData, GetRequestWorkflowVariables>;
export function getRequestWorkflow(dc: DataConnect, vars: GetRequestWorkflowVariables, options?: ExecuteQueryOptions): QueryPromise<GetRequestWorkflowData, GetRequestWorkflowVariables>;

interface GetDonorCommitmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDonorCommitmentVariables): QueryRef<GetDonorCommitmentData, GetDonorCommitmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetDonorCommitmentVariables): QueryRef<GetDonorCommitmentData, GetDonorCommitmentVariables>;
  operationName: string;
}
export const getDonorCommitmentRef: GetDonorCommitmentRef;

export function getDonorCommitment(vars: GetDonorCommitmentVariables, options?: ExecuteQueryOptions): QueryPromise<GetDonorCommitmentData, GetDonorCommitmentVariables>;
export function getDonorCommitment(dc: DataConnect, vars: GetDonorCommitmentVariables, options?: ExecuteQueryOptions): QueryPromise<GetDonorCommitmentData, GetDonorCommitmentVariables>;

interface ListAlertsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAlertsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAlertsData, undefined>;
  operationName: string;
}
export const listAlertsRef: ListAlertsRef;

export function listAlerts(options?: ExecuteQueryOptions): QueryPromise<ListAlertsData, undefined>;
export function listAlerts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListAlertsData, undefined>;

interface GetDashboardSummaryRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetDashboardSummaryData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetDashboardSummaryData, undefined>;
  operationName: string;
}
export const getDashboardSummaryRef: GetDashboardSummaryRef;

export function getDashboardSummary(options?: ExecuteQueryOptions): QueryPromise<GetDashboardSummaryData, undefined>;
export function getDashboardSummary(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetDashboardSummaryData, undefined>;

