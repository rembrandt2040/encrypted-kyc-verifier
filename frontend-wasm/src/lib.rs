use wasm_bindgen::prelude::*;
use tfhe::prelude::*;
use tfhe::{ConfigBuilder, generate_keys, set_server_key, FheUint8};

// ✅ Initialize once
#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn encrypt_value(value: u8) -> Vec<u8> {
    let config = ConfigBuilder::default().build();
    let (client_key, server_key) = generate_keys(config);
    set_server_key(server_key);

    let ciphertext = FheUint8::encrypt(value, &client_key);
    bincode::serialize(&ciphertext).unwrap()
}

#[wasm_bindgen]
pub fn decrypt_value(data: &[u8]) -> u8 {
    let config = ConfigBuilder::default().build();
    let (client_key, server_key) = generate_keys(config);
    set_server_key(server_key);

    let ciphertext: FheUint8 = bincode::deserialize(data).unwrap();
    ciphertext.decrypt(&client_key)
}
