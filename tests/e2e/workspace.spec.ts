import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

test("existing item upload, key gate, unchanged mock transfer and cancellation", async ({
  page,
}) => {
  await page.goto("/device");
  await page
    .getByRole("button", { name: "Connect device", exact: true })
    .click();
  await page
    .getByLabel("Item file (.bin)")
    .setInputFiles("tests/fixtures/tamacat/pa-tomaquet.bin");
  await expect(
    page.getByRole("button", { name: "Simulate item upload" }),
  ).toBeDisabled();
  await page.getByLabel("Local protocol key (.json)").setInputFiles({
    name: "test-key.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ keyHex: "0102030405060708" })),
  });
  await page.getByRole("button", { name: "Start capture" }).click();
  await page.getByRole("button", { name: "Simulate item upload" }).click();
  await expect(page.getByRole("status")).toContainText("Mock upload completed");
  await expect(
    page.getByText("Acknowledged: 16,384 / 16,384 bytes"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop capture" }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON", exact: true }).click();
  const capture = JSON.parse(
    await readFile((await (await pending).path())!, "utf8"),
  ) as { direction: string; length: number; hex: string }[];
  const tx = capture.filter((e) => e.direction === "TX");
  expect(tx.map((e) => e.length)).toEqual([11, 4112, 4112, 4112, 4112]);
  expect(tx[0].hex).toBe("50 4B 54 20 31 36 33 38 34 0D 0A");
  await page.screenshot({
    path: "test-results/item-upload.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Forget protocol key" }).click();
  await expect(
    page.getByRole("button", { name: "Simulate item upload" }),
  ).toBeDisabled();
  await page.getByLabel("Item file (.bin)").setInputFiles({
    name: "bad.bin",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("bad"),
  });
  await expect(page.getByTestId("upload-file-message")).toContainText(
    "truncated",
  );
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await page.getByLabel("Simulated response").selectOption("timeout");
  await page
    .getByRole("button", { name: "Connect device", exact: true })
    .click();
  await page
    .getByLabel("Item file (.bin)")
    .setInputFiles("tests/fixtures/tamacat/pa-tomaquet.bin");
  await page.getByLabel("Local protocol key (.json)").setInputFiles({
    name: "test-key.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"keyHex":"0102"}'),
  });
  await page.getByRole("button", { name: "Simulate item upload" }).click();
  await page.getByRole("button", { name: "Cancel upload" }).click();
  await expect(page.getByRole("status")).toContainText("cancelled");
  await expect(
    page.getByRole("button", { name: "Connect device", exact: true }),
  ).toBeEnabled();
});
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
  await page.getByLabel("Upload image").setInputFiles({
    name: "red.png",
    mimeType: "image/png",
    buffer: Buffer.from(base64, "base64"),
  });
  await page
    .getByText("Advanced: standalone sprite export", { exact: true })
    .click();
  await page.getByRole("button", { name: "Build sprite binary" }).click();
  await expect(
    page.getByRole("button", { name: "Download sprite only" }),
  ).toBeVisible();
  await page
    .getByLabel("Item template (.bin)")
    .setInputFiles("tests/fixtures/tamacat/pa-tomaquet.bin");
  await expect(
    page.getByRole("button", { name: "Download item .bin" }),
  ).toHaveCount(0);
  await page.getByRole("combobox", { name: "Template frame" }).selectOption("1");
  await page
    .getByRole("button", { name: "Convert image to item .bin" })
    .click();
  await expect(page.getByTestId("binary-message")).toContainText(
    "16,384 bytes",
  );
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download item .bin" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("red.item.bin");
  const bytes = await readFile((await download.path())!);
  expect(bytes.length).toBe(16384);
  expect(bytes.subarray(0, 4).toString()).toBe("ARC2");
  expect(bytes.readUInt32LE(4)).toBe(
    bytes.subarray(8).reduce((sum, b) => (sum + b) >>> 0, 0),
  );
  await page.getByRole("combobox", { name: "Template frame" }).selectOption("2");
  await expect(
    page.getByRole("button", { name: "Download item .bin" }),
  ).toHaveCount(0);
  await page.getByLabel("Sprite width", { exact: true }).fill("16");
  await page
    .getByRole("button", { name: "Convert image to item .bin" })
    .click();
  await expect(page.getByTestId("binary-message")).toContainText("32 × 32");
  await page.getByLabel("Item template (.bin)").setInputFiles({
    name: "bad.bin",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("bad"),
  });
  await expect(
    page.getByRole("button", { name: "Convert image to item .bin" }),
  ).toBeDisabled();
  await page.screenshot({
    path: "test-results/binary-export.png",
    fullPage: true,
  });
});

test("artwork converts to an item and reaches the uploader unchanged", async ({
  page,
}) => {
  await page.goto("/studio");
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 32;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "rgba(255,0,0,0.75)";
    context.fillRect(0, 0, 64, 32);
    return canvas.toDataURL().split(",")[1];
  });
  await page
    .getByLabel("Upload image")
    .setInputFiles({
      name: "my-art.png",
      mimeType: "image/png",
      buffer: Buffer.from(base64, "base64"),
    });
  await page.getByLabel("Sprite width", { exact: true }).fill("24");
  await page
    .getByLabel("Item template (.bin)")
    .setInputFiles("tests/fixtures/tamacat/pa-tomaquet.bin");
  await expect(page.getByLabel("Sprite width", { exact: true })).toHaveValue(
    "32",
  );
  await expect(
    page.getByRole("img", { name: "Original template frame", exact: true }),
  ).toBeVisible();
  await page.getByRole("combobox", { name: "Template frame" }).selectOption("1");
  await page
    .getByRole("button", { name: "Convert image to item .bin" })
    .click();
  const converted = page.getByRole("img", {
    name: "Converted item preview",
    exact: true,
  });
  await expect(converted).toBeVisible();
  const alpha = await converted.evaluate((element) => {
    const ctx = (element as HTMLCanvasElement).getContext("2d")!;
    return [
      ctx.getImageData(16, 0, 1, 1).data[3],
      ctx.getImageData(16, 16, 1, 1).data[3],
    ];
  });
  expect(alpha).toEqual([0, 255]);
  await page.getByLabel("Transparency cutoff").fill("220");
  await expect(page.getByRole("link", { name: "Use in uploader" })).toHaveCount(
    0,
  );
  await page.getByLabel("Transparency cutoff").fill("128");
  await page
    .getByRole("button", { name: "Convert image to item .bin" })
    .click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download item .bin" }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("my-art.item.bin");
  const binary = await readFile((await download.path())!);
  const sha = createHash("sha256").update(binary).digest("hex");
  await page.screenshot({
    path: "test-results/item-workspace.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Use in uploader" }).click();
  await expect(page).toHaveURL(/\/device#item-upload$/);
  const uploader = page.getByRole("region", { name: "Existing item upload" });
  await expect(uploader).toContainText("my-art.item.bin");
  await expect(uploader).toContainText(sha);
  await expect(uploader).toContainText("Converted in Sprite workspace");
  await expect(
    page.getByRole("button", { name: "Simulate item upload" }),
  ).toBeDisabled();
  await expect(page.getByText("A quiet little channel.")).toBeVisible();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download selected item .bin" })
    .click();
  expect(await readFile((await (await pending).path())!)).toEqual(binary);
  await page
    .getByRole("button", { name: "Connect device", exact: true })
    .click();
  await page
    .getByLabel("Local protocol key (.json)")
    .setInputFiles({
      name: "synthetic.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"keyHex":"0102"}'),
    });
  await page.getByRole("button", { name: "Start capture" }).click();
  await page.getByRole("button", { name: "Simulate item upload" }).click();
  await expect(page.getByRole("status")).toContainText("Mock upload completed");
  const captured = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON", exact: true }).click();
  const capture = JSON.parse(
    await readFile((await (await captured).path())!, "utf8"),
  ) as { direction: string; length: number; hex: string }[];
  const reconstructed = capture
    .filter((e) => e.direction === "TX" && e.length > 16)
    .map((e) => {
      const bytes = Buffer.from(e.hex.replaceAll(" ", ""), "hex");
      const stream = createHash("sha256")
        .update(bytes.subarray(0, 4))
        .update(Buffer.from([1, 2]))
        .digest();
      const plain = Uint8Array.from(bytes.subarray(4), (b, i) => {
        const n = i % 32;
        const value = b ^ stream[n];
        stream[n] = (2 * stream[n] + 1) & 255;
        return value;
      });
      return plain.slice(12);
    });
  expect(Buffer.concat(reconstructed)).toEqual(binary);
  await page.getByRole("button", { name: "Clear selected item" }).click();
  await expect(uploader).not.toContainText("my-art.item.bin");
  await expect(
    page.getByRole("button", { name: "Simulate item upload" }),
  ).toBeDisabled();
});
