import { readFile } from "node:fs/promises";
import path from "node:path";

export type ClientAsset = {
  body: Buffer;
  contentType: string;
};

const clientRoot = path.resolve(process.cwd(), "dist/client");

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export async function readClientAsset(
  pathname: string,
): Promise<ClientAsset | null> {
  const assetPath = resolveClientAssetPath(pathname);

  if (!assetPath) {
    return null;
  }

  try {
    const body = await readFile(assetPath);
    return {
      body,
      contentType:
        contentTypes[path.extname(assetPath)] ??
        "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export async function readClientIndex(): Promise<ClientAsset | null> {
  return readClientAsset("/");
}

function resolveClientAssetPath(pathname: string) {
  const normalizedPath = pathname === "/" ? "/index.html" : pathname;
  const decodedPath = decodeURIComponent(normalizedPath);
  const assetPath = path.resolve(clientRoot, `.${decodedPath}`);

  if (!assetPath.startsWith(`${clientRoot}${path.sep}`)) {
    return null;
  }

  return assetPath;
}
