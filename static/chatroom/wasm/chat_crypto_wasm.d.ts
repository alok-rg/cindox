/* tslint:disable */
/* eslint-disable */
export function generate_aes_key(): string;
export function generate_nonce(): string;
export function encrypt_aes_key_with_rsa(aes_key_b64: string, public_key_pem: string): string;
export function decrypt_aes_key_with_rsa(encrypted_key_b64: string, private_key_pem: string): string;
export function encrypt_message(aes_key_b64: string, plaintext: string, nonce_b64: string): string;
export function decrypt_message(aes_key_b64: string, ciphertext_b64: string, nonce_b64: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly generate_aes_key: () => [number, number];
  readonly generate_nonce: () => [number, number];
  readonly encrypt_aes_key_with_rsa: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly decrypt_aes_key_with_rsa: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly encrypt_message: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
  readonly decrypt_message: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
