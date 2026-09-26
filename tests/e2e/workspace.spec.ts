import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("mock console, capture, navigation, and timeout", async ({ page }) => {
  await page.goto("/device");
  await page.getByRole("button", { name: "Start capture" }).click();
  await page
    .getByRole("button", { name: "Connect device", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Mock connected");
  await page.getByRole("button", { name: "Send test" }).click();
  await expect(page.getByRole("status")).toContainText("Simulation passed");
  await expect(page.getByRole("tabpanel")).toContainText("45 43 48 4F");
  await page.getByRole("tab", { name: "ASCII", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("ECHO REP");
  await page.getByRole("button", { name: "Stop capture" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.json$/);
  await page.getByRole("button", { name: "Clear log" }).click();
  await expect(page.getByText("2 captured", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Studio", exact: true }).click();
  await page.getByRole("link", { name: "Device lab", exact: true }).click();
  await expect(page.getByRole("button", { name: "Send test" })).toBeEnabled();
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await page.getByLabel("Simulated response").selectOption("timeout");
  await page
    .getByRole("button", { name: "Connect device", exact: true })
    .click();
  await page.getByRole("button", { name: "Send test" }).click();
  await expect(page.getByRole("status")).toContainText("No echo reply");
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await page.getByLabel("Simulated response").selectOption("error");
  await page
    .getByRole("button", { name: "Connect device", exact: true })
    .click();
  await page.getByRole("button", { name: "Send test" }).click();
  await expect(page.getByRole("status")).toContainText("Simulated error");
  await page.screenshot({
    path: "test-results/device-lab.png",
    fullPage: true,
  });
});
test("image crop, palette, PNG export, and IndexedDB draft", async ({
  page,
}) => {
  await page.goto("/studio");
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#dd8257";
    ctx.fillRect(4, 8, 36, 32);
    ctx.fillStyle = "#77934c";
    ctx.fillRect(20, 0, 8, 12);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.getByLabel("Upload image").setInputFiles({
    name: "test-art.png",
    mimeType: "image/png",
    buffer: Buffer.from(base64, "base64"),
  });
  await expect(
    page.getByRole("img", { name: "Pixel sprite preview" }),
  ).toBeVisible();
  await page.getByLabel("Crop width", { exact: true }).fill("1000");
  await expect(page.getByRole("status")).toContainText("Crop must");
  await expect(page.getByRole("button", { name: "Export PNG" })).toBeDisabled();
  await page.getByLabel("Crop width", { exact: true }).fill("40");
  await page.getByLabel("Palette limit").selectOption("2");
  await page.getByLabel("Sprite width", { exact: true }).fill("24");
  await page.getByLabel("Item name").fill("Tiny test toy");
  await expect(page.getByRole("button", { name: "Save draft" })).toBeEnabled();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toContainText("Saved locally");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PNG" }).click();
  expect((await download).suggestedFilename()).toBe("tama-sprite-preview.png");
  await page.reload();
  await page.getByRole("button", { name: "Open draft" }).click();
  await expect(page.getByLabel("Item name")).toHaveValue("Tiny test toy");
  await expect(page.getByLabel("Sprite width", { exact: true })).toHaveValue(
    "24",
  );
  await expect(
    page.getByRole("img", { name: "Pixel sprite preview" }),
  ).toBeVisible();
  const sizes = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open("tama-paradise-studio");
      req.onsuccess = () => resolve(req.result);
    });
    return new Promise<number[]>((resolve) => {
      const req = db.transaction("drafts").objectStore("drafts").get("current");
      req.onsuccess = () => {
        resolve([
          req.result.originalImage.size,
          req.result.processedImage.size,
          req.result.spriteImage.size,
        ]);
        db.close();
      };
    });
  });
  expect(sizes.every((size) => size > 0)).toBe(true);
  await page.screenshot({
    path: "test-results/sprite-studio.png",
    fullPage: true,
  });
});
test("developer settings gate the baud rate", async ({ page }) => {
  await page.goto("/device");
  await expect(page.getByLabel("Baud rate", { exact: true })).toBeDisabled();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByLabel("Enable Developer Mode").check();
  await page.getByRole("link", { name: "Device lab", exact: true }).click();
  await expect(page.getByLabel("Baud rate", { exact: true })).toBeEnabled();
});

test("experimental item build, decoded preview, export and stale output prevention", async ({
  page,
}) => {
  await page.goto("/studio");
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 32, 32);
    return canvas.toDataURL().split(",")[1];
  });
  await page
    .getByLabel("Upload image")
    .setInputFiles({
      name: "red.png",
      mimeType: "image/png",
      buffer: Buffer.from(base64, "base64"),
    });
  await page.getByRole("button", { name: "Build sprite binary" }).click();
  await expect(
    page.getByRole("img", { name: "Decoded binary preview" }),
  ).toBeVisible();
  await page
    .getByLabel("Item template (.bin)")
    .setInputFiles("tests/fixtures/tamacat/pa-tomaquet.bin");
  await expect(page.getByRole("button", { name: "Export binary" })).toHaveCount(
    0,
  );
  await page.getByLabel("Template frame").selectOption("1");
  await page.getByRole("button", { name: "Build item binary" }).click();
  await expect(page.getByTestId("binary-message")).toContainText(
    "16,384 bytes",
  );
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export binary" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("tama-experimental.item.bin");
  const bytes = await readFile((await download.path())!);
  expect(bytes.length).toBe(16384);
  expect(bytes.subarray(0, 4).toString()).toBe("ARC2");
  expect(bytes.readUInt32LE(4)).toBe(
    bytes.subarray(8).reduce((sum, b) => (sum + b) >>> 0, 0),
  );
  await page.getByLabel("Template frame").selectOption("2");
  await expect(page.getByRole("button", { name: "Export binary" })).toHaveCount(
    0,
  );
  await page.getByLabel("Sprite width", { exact: true }).fill("16");
  await page.getByRole("button", { name: "Build item binary" }).click();
  await expect(page.getByTestId("binary-message")).toContainText("32 × 32");
  await page
    .getByLabel("Item template (.bin)")
    .setInputFiles({
      name: "bad.bin",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("bad"),
    });
  await expect(
    page.getByRole("button", { name: "Build item binary" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Send to Tamagotchi" }),
  ).toBeDisabled();
  await page.screenshot({
    path: "test-results/binary-export.png",
    fullPage: true,
  });
});
