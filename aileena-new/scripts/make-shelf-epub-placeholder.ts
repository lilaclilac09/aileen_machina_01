/**
 * Write a tiny placeholder EPUB under .data/shelf-epubs/{slug}.epub for local QA.
 * Not for production books — drop real EPUBs with the same filename.
 *
 * Usage: pnpm exec tsx scripts/make-shelf-epub-placeholder.ts bad-feminist
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const slug = (process.argv[2] || 'bad-feminist').trim().toLowerCase();
if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(slug)) {
  console.error('invalid slug');
  process.exit(1);
}

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function zipStore(entries: { name: string; data: Buffer }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const data = entry.data;
    const crc = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8); // store
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    const localFull = Buffer.concat([local, data]);
    locals.push(localFull);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);
    offset += localFull.length;
  }
  const centralDir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, centralDir, end]);
}

void (async () => {
  const dir = join(process.cwd(), '.data', 'shelf-epubs');
  await mkdir(dir, { recursive: true });
  const title = `Placeholder · ${slug}`;
  const entries = [
    {
      name: 'mimetype',
      data: Buffer.from('application/epub+zip', 'utf8'),
    },
    {
      name: 'META-INF/container.xml',
      data: Buffer.from(
        `<?xml version="1.0"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n  <rootfiles>\n    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n  </rootfiles>\n</container>\n`,
        'utf8',
      ),
    },
    {
      name: 'OEBPS/content.opf',
      data: Buffer.from(
        `<?xml version="1.0" encoding="utf-8"?>\n<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="2.0">\n  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n    <dc:title>${title}</dc:title>\n    <dc:language>en</dc:language>\n    <dc:identifier id="uid">aileena-placeholder-${slug}</dc:identifier>\n  </metadata>\n  <manifest>\n    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n    <item id="ch1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>\n  </manifest>\n  <spine toc="ncx">\n    <itemref idref="ch1"/>\n  </spine>\n</package>\n`,
        'utf8',
      ),
    },
    {
      name: 'OEBPS/toc.ncx',
      data: Buffer.from(
        `<?xml version="1.0" encoding="utf-8"?>\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n  <head><meta name="dtb:uid" content="aileena-placeholder-${slug}"/></head>\n  <docTitle><text>${title}</text></docTitle>\n  <navMap>\n    <navPoint id="n1" playOrder="1"><navLabel><text>One</text></navLabel><content src="chapter1.xhtml"/></navPoint>\n  </navMap>\n</ncx>\n`,
        'utf8',
      ),
    },
    {
      name: 'OEBPS/chapter1.xhtml',
      data: Buffer.from(
        `<?xml version="1.0" encoding="utf-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml">\n<head><title>${title}</title></head>\n<body>\n  <h1>${title}</h1>\n  <p>Local QA placeholder. Replace this file with the real EPUB named <code>${slug}.epub</code>.</p>\n  <p>Turn pages with the arrows or keyboard. Progress syncs for the owner session.</p>\n  <p>${'Lorem ipsum dolor sit amet. '.repeat(40)}</p>\n</body>\n</html>\n`,
        'utf8',
      ),
    },
  ];
  // mimetype must be first and uncompressed — zipStore already stores uncompressed.
  const out = join(dir, `${slug}.epub`);
  await writeFile(out, zipStore(entries));
  console.log(`wrote ${out}`);
})();
