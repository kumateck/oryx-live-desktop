import { fireEvent, screen } from "@testing-library/react";

/** Opens an action menu by its button's name and returns once its entries are shown. */
export async function openMenu(name: string | RegExp, scope: Pick<typeof screen, "findByRole"> = screen): Promise<void> {
  // Radix opens on pointer down; a plain click does not open it in jsdom.
  fireEvent.pointerDown(await scope.findByRole("button", { name }), { button: 0, ctrlKey: false });
  await screen.findByRole("menu");
}

/** Opens an action menu and chooses one of its entries. */
export async function chooseAction(menu: string | RegExp, action: string | RegExp, scope: Pick<typeof screen, "findByRole"> = screen): Promise<void> {
  await openMenu(menu, scope);
  fireEvent.click(await screen.findByRole("menuitem", { name: action }));
}
