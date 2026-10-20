mod native;
use wasm_bindgen::JsCast;
use wordcraft_engine::Session;
use wordcraft_ui_egui::{Services, WordApp};
fn main() {
    wasm_bindgen_futures::spawn_local(async {
        if let Err(error) = start().await { native::failed(&format!("{error:?}")); }
    });
}
async fn start() -> Result<(), wasm_bindgen::JsValue> {
    let (name, bytes) = native::open().await?;
    let document = wordcraft_engine::io::open_bytes(&name, &bytes)
        .map_err(|e| wasm_bindgen::JsValue::from_str(&e))?;
    let canvas = web_sys::window().and_then(|w| w.document())
        .and_then(|d| d.get_element_by_id("wordcraft_canvas"))
        .ok_or_else(|| wasm_bindgen::JsValue::from_str("Document canvas unavailable"))?
        .dyn_into::<web_sys::HtmlCanvasElement>()?;
    eframe::WebRunner::new().start(canvas, eframe::WebOptions::default(), Box::new(move |_| {
        let mut session = Session::new(document);
        session.path = Some(name.into());
        session.read_only = true;
        let mut app = WordApp::new(session, Services::default());
        app.autosave = false;
        app.ui.show_discord = false;
        app.ui.theme = wordcraft_ui_egui::theme::Appearance::System;
        Ok(Box::new(Viewer { app }))
    })).await
}
struct Viewer { app: WordApp }
impl eframe::App for Viewer {
    fn logic(&mut self, ctx: &egui::Context, _: &mut eframe::Frame) { self.app.logic(ctx); }
    fn raw_input_hook(&mut self, _: &egui::Context, raw: &mut egui::RawInput) {
        raw.dropped_files.clear();
        raw.hovered_files.clear();
    }
    fn ui(&mut self, ui: &mut egui::Ui, _: &mut eframe::Frame) { self.app.ui(ui); }
}
