use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = dodoDocument, js_name = read)]
    fn read() -> js_sys::Promise;
    #[wasm_bindgen(js_namespace = dodoDocument)]
    pub fn failed(message: &str);
}
pub async fn open() -> Result<(String, Vec<u8>), JsValue> {
    let result = JsFuture::from(read()).await?;
    let name = js_sys::Reflect::get(&result, &"name".into())?.as_string()
        .ok_or_else(|| JsValue::from_str("Invalid document name"))?;
    let bytes = js_sys::Uint8Array::new(&js_sys::Reflect::get(&result, &"bytes".into())?).to_vec();
    Ok((name, bytes))
}
