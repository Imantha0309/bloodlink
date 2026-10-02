/**
 * Bloodlink theme entry point.
 *
 * The CSS side effect lives here and only here. Colors live in `./colors`,
 * which has no imports — components that just need a palette should import
 * from `./colors` directly so they don't depend on this module.
 */

import '@/global.css';

export * from '@/constants/colors';