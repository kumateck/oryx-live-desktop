pub fn allowed(id: &str) -> bool {
    id.starts_with("view.")
        || id.starts_with("comment.") && !matches!(id, "comment.import" | "comment.export" | "comment.summarize" | "comment.attach" | "comment.stamp")
        || matches!(id,
            "file.save" | "file.properties" | "edit.undo" | "edit.redo" | "edit.find"
            | "edit.advanced_search" | "edit.text" | "form.fields" | "form.clear"
            | "page.organize" | "page.rotate" | "page.rotate_ccw" | "page.rotate_dialog"
            | "page.delete" | "page.insert_blank" | "page.duplicate" | "page.crop"
            | "page.boxes" | "help.shortcuts")
}

pub fn group(id: &str) -> bool {
    matches!(id, "edit" | "organize" | "comment" | "form")
}
