// Shim for zlibjs using pako for browser compatibility
import pako from 'pako';

export const Zlib = {
  Gunzip: class {
    private data: Uint8Array;

    constructor(data: Uint8Array) {
      this.data = data;
    }

    decompress(): Uint8Array {
      return pako.ungzip(this.data);
    }
  },
};

export default Zlib;
