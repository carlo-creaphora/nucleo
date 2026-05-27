import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type ClientAsset = {
  body: Buffer;
  contentType: string;
};

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoots = [
  path.resolve(process.cwd(), "dist/client"),
  path.resolve(process.cwd(), "../dist/client"),
  path.resolve(moduleDir, "../../client"),
  path.resolve(moduleDir, "../../dist/client"),
  path.resolve(moduleDir, "../../../dist/client"),
];

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
  const assetPaths = resolveClientAssetPaths(pathname);

  for (const assetPath of assetPaths) {
    try {
      const body = await readFile(assetPath);
      return {
        body,
        contentType:
          contentTypes[path.extname(assetPath)] ??
          "application/octet-stream",
      };
    } catch {
      // Try the next candidate root. Vercel can execute functions from a
      // nested cwd while includeFiles keeps dist/client at the task root.
    }
  }

  return null;
}

export async function readClientIndex(): Promise<ClientAsset | null> {
  return readClientAsset("/");
}

function resolveClientAssetPaths(pathname: string) {
  const normalizedPath = pathname === "/" ? "/index.html" : pathname;
  const decodedPath = decodeURIComponent(normalizedPath);
  const assetPaths: string[] = [];

  for (const clientRoot of clientRoots) {
    const assetPath = path.resolve(clientRoot, `.${decodedPath}`);

    if (assetPath.startsWith(`${clientRoot}${path.sep}`)) {
      assetPaths.push(assetPath);
    }
  }

  return assetPaths;
}
