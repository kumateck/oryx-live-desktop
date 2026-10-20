mod native;
use pdfcraft_ui_egui::PdfCraftApp;
use wasm_bindgen::JsCast;
fn main() {
    wasm_bindgen_futures::spawn_local(async {
        if let Err(error) = start().await { native::failed(&format!("{error:?}")); }
    });
}
async fn start() -> Result<(), wasm_bindgen::JsValue> {
    let (name, bytes) = native::open().await?;
    let canvas = web_sys::window().and_then(|w| w.document())
        .and_then(|d| d.get_element_by_id("pdfcraft_canvas"))
        .ok_or_else(|| wasm_bindgen::JsValue::from_str("PDF canvas unavailable"))?
        .dyn_into::<web_sys::HtmlCanvasElement>()?;
    eframe::WebRunner::new().start(canvas, eframe::WebOptions::default(), Box::new(move |_| {
        let mut app = PdfCraftApp::new();
        app.session.read_only = true;
        app.session.set_javascript(false);
        app.open_bytes(&name, None, bytes).map_err(std::io::Error::other)?;
        Ok(Box::new(Viewer { app }))
    })).await
}
struct Viewer { app: PdfCraftApp }
impl eframe::App for Viewer {
    fn logic(&mut self, ctx: &egui::Context, frame: &mut eframe::Frame) { self.app.logic(ctx, frame); }
    fn raw_input_hook(&mut self, _: &egui::Context, raw: &mut egui::RawInput) {
        raw.dropped_files.clear(); raw.hovered_files.clear();
    }
    fn ui(&mut self, ui: &mut egui::Ui, frame: &mut eframe::Frame) { self.app.ui(ui, frame); }
}
