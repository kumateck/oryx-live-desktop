mod native;
use wasm_bindgen::JsCast;
use gridcraft_engine::{DocState, Session};
use gridcraft_ui_egui::{Services, SheetApp};
fn main() {
    wasm_bindgen_futures::spawn_local(async {
        if let Err(error) = start().await { native::failed(&format!("{error:?}")); }
    });
}
async fn start() -> Result<(), wasm_bindgen::JsValue> {
    let (name, bytes) = native::open().await?;
    let (workbook, _) = gridcraft_engine::io::open_bytes(&name, &bytes)
        .map_err(|e| wasm_bindgen::JsValue::from_str(&e.to_string()))?;
    let canvas = web_sys::window().and_then(|w| w.document())
        .and_then(|d| d.get_element_by_id("gridcraft_canvas"))
        .ok_or_else(|| wasm_bindgen::JsValue::from_str("Spreadsheet canvas unavailable"))?
        .dyn_into::<web_sys::HtmlCanvasElement>()?;
    eframe::WebRunner::new().start(canvas, eframe::WebOptions::default(), Box::new(move |cc| {
        SheetApp::setup_context(&cc.egui_ctx, false);
        let mut session = Session::new();
        session.add_document(DocState::new(workbook, Some(name.clone()), name));
        session.read_only = true;
        let mut app = SheetApp::new(session, Services::default());
        if app.grid.autosave() { app.grid.toggle_autosave(); }
        app.ui.system_theme = true;
        Ok(Box::new(Viewer { app }))
    })).await
}
struct Viewer { app: SheetApp }
impl eframe::App for Viewer {
    fn logic(&mut self, ctx: &egui::Context, _: &mut eframe::Frame) { self.app.logic(ctx); }
    fn raw_input_hook(&mut self, _: &egui::Context, raw: &mut egui::RawInput) {
        raw.dropped_files.clear(); raw.hovered_files.clear();
    }
    fn ui(&mut self, ui: &mut egui::Ui, _: &mut eframe::Frame) { self.app.ui(ui); }
}
