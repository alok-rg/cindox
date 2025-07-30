/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const generate_aes_key: () => [number, number];
export const generate_nonce: () => [number, number];
export const encrypt_aes_key_with_rsa: (a: number, b: number, c: number, d: number) => [number, number, number, number];
export const decrypt_aes_key_with_rsa: (a: number, b: number, c: number, d: number) => [number, number, number, number];
export const encrypt_message: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
export const decrypt_message: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
export const __wbindgen_exn_store: (a: number) => void;
export const __externref_table_alloc: () => number;
export const __wbindgen_export_2: WebAssembly.Table;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __externref_table_dealloc: (a: number) => void;
export const __wbindgen_start: () => void;
