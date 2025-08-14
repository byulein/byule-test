(function(){
  function toUtf8Bytes(text){
    return new TextEncoder().encode(text);
  }

  function fromUtf8Bytes(bytes){
    return new TextDecoder().decode(bytes);
  }

  function base64Encode(input){
    const bytes = typeof input === 'string' ? toUtf8Bytes(input) : input;
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function base64Decode(b64, asBytes = false){
    const binary = atob(String(b64).replace(/\s+/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return asBytes ? bytes : fromUtf8Bytes(bytes);
  }

  function base64UrlToBase64(s){
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad) s += '='.repeat(4 - pad);
    return s;
  }

  function base64UrlEncode(input){
    return base64Encode(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
  }

  function base64UrlDecode(s, asBytes = false){
    return base64Decode(base64UrlToBase64(s), asBytes);
  }

  function urlEncode(s){
    return encodeURIComponent(s);
  }

  function urlDecode(s){
    return decodeURIComponent(s);
  }

  function hexEncode(input){
    const bytes = typeof input === 'string' ? toUtf8Bytes(input) : input;
    let out = '';
    for (let i = 0; i < bytes.length; i++){
      const h = bytes[i].toString(16).padStart(2, '0');
      out += h;
    }
    return out;
  }

  function hexDecode(hexString, asBytes = false){
    const clean = String(hexString).replace(/[^a-fA-F0-9]/g, '');
    if (clean.length % 2 !== 0) throw new Error('Invalid hex length');
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2){
      bytes[i/2] = parseInt(clean.slice(i, i+2), 16);
    }
    return asBytes ? bytes : fromUtf8Bytes(bytes);
  }

  function binaryEncode(input){
    const bytes = typeof input === 'string' ? toUtf8Bytes(input) : input;
    let out = '';
    for (let i = 0; i < bytes.length; i++){
      out += bytes[i].toString(2).padStart(8, '0');
      if (i !== bytes.length - 1) out += ' ';
    }
    return out;
  }

  function binaryDecode(bits, asBytes = false){
    const clean = String(bits).replace(/[^01]/g, '');
    if (clean.length % 8 !== 0) throw new Error('Invalid binary length');
    const bytes = new Uint8Array(clean.length / 8);
    for (let i = 0, j = 0; i < clean.length; i += 8, j++){
      bytes[j] = parseInt(clean.slice(i, i+8), 2);
    }
    return asBytes ? bytes : fromUtf8Bytes(bytes);
  }

  function htmlEntitiesEncode(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function htmlEntitiesDecode(str){
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent || '';
  }

  function unicodeEscape(str){
    let out = '';
    for (const ch of str){
      const codePoint = ch.codePointAt(0);
      if (codePoint <= 0xFFFF){
        out += '\\u' + codePoint.toString(16).toUpperCase().padStart(4,'0');
      } else {
        const cp = codePoint - 0x10000;
        const hs = (cp >> 10) + 0xD800;
        const ls = (cp & 0x3FF) + 0xDC00;
        out += '\\u' + hs.toString(16).toUpperCase().padStart(4,'0');
        out += '\\u' + ls.toString(16).toUpperCase().padStart(4,'0');
      }
    }
    return out;
  }

  function unicodeUnescape(str){
    let out = '';
    let i = 0;
    while (i < str.length){
      if (str[i] === '\\' && i + 1 < str.length){
        const next = str[i+1];
        if (next === 'u' && i + 5 < str.length){
          const hex = str.slice(i+2, i+6);
          if (/^[0-9a-fA-F]{4}$/.test(hex)){
            const code = parseInt(hex, 16);
            out += String.fromCharCode(code);
            i += 6;
            continue;
          }
        }
        if (next === 'u' && str[i+2] === '{'){
          const close = str.indexOf('}', i+3);
          if (close !== -1){
            const hex = str.slice(i+3, close);
            if (/^[0-9a-fA-F]+$/.test(hex)){
              const code = parseInt(hex, 16);
              out += String.fromCodePoint(code);
              i = close + 1;
              continue;
            }
          }
        }
      }
      out += str[i];
      i++;
    }
    return out;
  }

  const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const BASE32_LOOKUP = (() => {
    const map = {};
    for (let i = 0; i < BASE32_ALPHABET.length; i++){
      map[BASE32_ALPHABET[i]] = i;
    }
    return map;
  })();

  function base32EncodeBytes(bytes){
    let output = '';
    let i = 0;
    while (i < bytes.length){
      const byte1 = bytes[i++] || 0;
      const byte2 = bytes[i++] || 0;
      const byte3 = bytes[i++] || 0;
      const byte4 = bytes[i++] || 0;
      const byte5 = bytes[i++] || 0;

      const index1 = (byte1 >> 3) & 31;
      const index2 = ((byte1 & 7) << 2 | (byte2 >> 6)) & 31;
      const index3 = ((byte2 >> 1) & 31);
      const index4 = ((byte2 & 1) << 4 | (byte3 >> 4)) & 31;
      const index5 = ((byte3 & 15) << 1 | (byte4 >> 7)) & 31;
      const index6 = ((byte4 >> 2) & 31);
      const index7 = ((byte4 & 3) << 3 | (byte5 >> 5)) & 31;
      const index8 = (byte5 & 31);

      const remaining = bytes.length - (i - 5);

      output += BASE32_ALPHABET[index1];
      output += BASE32_ALPHABET[index2];
      output += remaining >= 2 ? BASE32_ALPHABET[index3] : '=';
      output += remaining >= 2 ? BASE32_ALPHABET[index4] : '=';
      output += remaining >= 3 ? BASE32_ALPHABET[index5] : '=';
      output += remaining >= 4 ? BASE32_ALPHABET[index6] : '=';
      output += remaining >= 5 ? BASE32_ALPHABET[index7] : '=';
      output += remaining >= 5 ? BASE32_ALPHABET[index8] : '=';
    }
    return output;
  }

  function base32DecodeToBytes(str){
    const clean = String(str).toUpperCase().replace(/[^A-Z2-7=]/g, '');
    const bytes = [];
    for (let i = 0; i < clean.length; i += 8){
      const c1 = clean[i];
      const c2 = clean[i+1];
      const c3 = clean[i+2];
      const c4 = clean[i+3];
      const c5 = clean[i+4];
      const c6 = clean[i+5];
      const c7 = clean[i+6];
      const c8 = clean[i+7];

      const i1 = BASE32_LOOKUP[c1] ?? 0;
      const i2 = BASE32_LOOKUP[c2] ?? 0;
      const i3 = c3 === '=' ? 0 : BASE32_LOOKUP[c3];
      const i4 = c4 === '=' ? 0 : BASE32_LOOKUP[c4];
      const i5 = c5 === '=' ? 0 : BASE32_LOOKUP[c5];
      const i6 = c6 === '=' ? 0 : BASE32_LOOKUP[c6];
      const i7 = c7 === '=' ? 0 : BASE32_LOOKUP[c7];
      const i8 = c8 === '=' ? 0 : BASE32_LOOKUP[c8];

      const b1 = (i1 << 3) | (i2 >> 2);
      const b2 = ((i2 & 3) << 6) | (i3 << 1) | (i4 >> 4);
      const b3 = ((i4 & 15) << 4) | (i5 >> 1);
      const b4 = ((i5 & 1) << 7) | (i6 << 2) | (i7 >> 3);
      const b5 = ((i7 & 7) << 5) | i8;

      if (c3 !== '=') bytes.push(b1);
      if (c5 !== '=') bytes.push(b2);
      if (c6 !== '=') bytes.push(b3);
      if (c7 !== '=') bytes.push(b4);
      if (c8 !== '=') bytes.push(b5);
    }
    return new Uint8Array(bytes);
  }

  function base32EncodeString(text){
    return base32EncodeBytes(toUtf8Bytes(text));
  }

  function base32DecodeToString(str){
    return fromUtf8Bytes(base32DecodeToBytes(str));
  }

  const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const BASE58_MAP = (() => {
    const map = {};
    for (let i = 0; i < BASE58_ALPHABET.length; i++) map[BASE58_ALPHABET[i]] = i;
    return map;
  })();

  function base58EncodeBytes(bytes){
    let zeroes = 0;
    while (zeroes < bytes.length && bytes[zeroes] === 0) zeroes++;
    let digits = [];
    for (let i = zeroes; i < bytes.length; i++){
      let carry = bytes[i];
      for (let j = 0; j < digits.length; j++){
        const x = (digits[j] << 8) + carry;
        digits[j] = Math.floor(x / 58);
        carry = x % 58;
      }
      while (carry > 0){
        digits.push(Math.floor(carry / 58));
        carry = carry % 58;
      }
      for (let j = digits.length - 1; j >= 0; j--){
        if (digits[j] !== 0) break;
        // cleanup leading zeros inside representation
      }
    }
    let out = '1'.repeat(zeroes);
    for (let i = digits.length - 1; i >= 0; i--) out += BASE58_ALPHABET[digits[i]];
    return out;
  }

  function base58DecodeToBytes(str){
    const s = String(str);
    let zeroes = 0;
    let i = 0;
    while (i < s.length && s[i] === '1'){ zeroes++; i++; }

    const bytes = [];
    const b256 = [];
    for (; i < s.length; i++){
      const val = BASE58_MAP[s[i]];
      if (val === undefined) throw new Error('Invalid Base58 character');
      let carry = val;
      for (let j = 0; j < b256.length; j++){
        const x = b256[j] * 58 + carry;
        b256[j] = x & 0xff;
        carry = x >> 8;
      }
      while (carry > 0){
        b256.push(carry & 0xff);
        carry >>= 8;
      }
    }
    for (let k = 0; k < zeroes; k++) bytes.push(0);
    for (let k = b256.length - 1; k >= 0; k--) bytes.push(b256[k]);
    return new Uint8Array(bytes);
  }

  function base58EncodeString(text){
    return base58EncodeBytes(toUtf8Bytes(text));
  }

  function base58DecodeToString(s){
    return fromUtf8Bytes(base58DecodeToBytes(s));
  }

  function jwtDecode(token){
    const parts = String(token).trim().split('.');
    if (parts.length < 2) throw new Error('Invalid JWT: expected header.payload[.signature]');
    const [h, p, s] = parts;
    const headerJson = fromUtf8Bytes(base64UrlDecode(h, true));
    const payloadJson = fromUtf8Bytes(base64UrlDecode(p, true));
    let signatureBytes = null;
    if (s) signatureBytes = base64UrlDecode(s, true);
    return {
      headerRaw: headerJson,
      payloadRaw: payloadJson,
      header: JSON.parse(headerJson),
      payload: JSON.parse(payloadJson),
      signatureBytes
    };
  }

  function copyToClipboard(text){
    if (navigator.clipboard && navigator.clipboard.writeText){
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
    return Promise.resolve();
  }

  window.Encoders = {
    toUtf8Bytes,
    fromUtf8Bytes,
    base64Encode,
    base64Decode,
    base64UrlEncode,
    base64UrlDecode,
    urlEncode,
    urlDecode,
    hexEncode,
    hexDecode,
    binaryEncode,
    binaryDecode,
    htmlEntitiesEncode,
    htmlEntitiesDecode,
    unicodeEscape,
    unicodeUnescape,
    base32EncodeBytes,
    base32DecodeToBytes,
    base32EncodeString,
    base32DecodeToString,
    base58EncodeBytes,
    base58DecodeToBytes,
    base58EncodeString,
    base58DecodeToString,
    jwtDecode,
    copyToClipboard
  };
})();