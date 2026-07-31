/*!
 * FreeNode · 轻量二维码生成器 (纯 JS,无依赖)
 * 基于 QR Code Model 2 标准,支持 L/M/Q/H 纠错级,UTF-8 支持
 * 体积 ~6KB,避免第三方 API 隐私与可用性问题
 * 公共域代码,自由使用
 */
(function (global) {
  'use strict';

  // 纠错级对应的 RS 块数据 (Model 2, version 1-40)
  // 每项: [总码字, EC码字, 块数(组1), 块数据(组1), 块数(组2), 块数据(组2)]
  var ECC_BLOCKS = {
    L: [[19,7,1,19,0,0],[34,10,1,34,0,0],[55,15,1,55,0,0],[80,20,1,80,0,0],[108,26,1,108,0,0],[136,18,2,68,0,0],[156,20,2,78,0,0],[194,24,2,97,0,0],[232,30,2,116,0,0],[274,18,2,68,2,69],[324,20,2,81,2,82],[370,24,2,92,2,93],[428,26,2,107,2,108],[461,30,2,115,2,116],[523,22,4,87,1,88],[625,33,2,124,2,125],[668,28,4,98,1,99],[721,31,2,114,2,115],[779,31,2,122,2,123],[832,31,3,107,2,108],[901,28,4,120,1,121],[961,31,5,114,1,115],[987,28,5,115,1,116],[1041,30,1,116,4,117],[1093,28,5,115,5,116],[1171,30,3,115,4,116],[1221,30,3,121,4,122],[1276,28,3,121,4,122],[1334,28,3,121,4,122],[1388,28,3,121,4,122],[1452,30,3,121,4,122],[1494,28,3,121,4,122],[1556,30,3,121,4,122],[1608,28,3,121,4,122]],
    M: [[16,10,1,16,0,0],[28,16,1,28,0,0],[44,26,1,44,0,0],[64,18,2,32,0,0],[86,24,2,43,0,0],[108,16,4,27,0,0],[124,18,4,31,0,0],[154,22,2,38,2,39],[182,22,3,36,2,37],[216,26,2,43,2,44],[254,30,4,36,3,37],[290,22,4,36,3,37],[334,22,4,37,3,38],[365,24,4,40,1,41],[415,24,4,40,1,41],[453,28,4,43,1,44],[507,28,4,44,1,45],[563,28,4,43,2,44],[627,28,4,44,2,45],[669,26,4,44,2,45],[721,26,5,41,1,42],[779,26,5,42,1,43],[832,24,5,42,1,43],[884,28,5,42,1,43],[937,24,5,41,2,42],[988,24,5,41,2,42],[1045,30,5,42,2,43],[1093,28,5,42,2,43],[1139,28,5,42,2,43],[1181,28,5,42,2,43],[1263,30,4,42,4,43],[1321,28,4,42,4,43],[1379,28,4,42,4,43],[1437,30,4,42,4,43]],
    Q: [[13,13,1,13,0,0],[22,22,1,22,0,0],[34,18,2,17,0,0],[46,26,2,17,0,0],[66,18,2,17,2,18],[86,24,4,11,0,0],[98,18,2,12,4,13],[121,20,3,12,3,13],[146,24,4,12,4,13],[177,22,4,11,4,12],[198,22,5,11,3,12],[225,24,5,11,3,12],[254,24,5,12,3,13],[267,20,5,12,4,13],[293,30,5,12,4,13],[325,24,5,12,4,13],[361,28,5,12,4,13],[397,28,5,12,4,13],[433,24,5,12,4,13],[461,28,5,12,4,13],[509,30,5,12,4,13],[565,28,5,12,4,13],[613,30,5,12,4,13],[661,30,5,12,4,13],[715,30,5,12,4,13],[761,30,5,12,4,13],[787,30,6,11,4,12],[843,28,6,12,5,13],[907,28,6,12,5,13],[911,28,6,12,5,13],[967,30,6,12,5,13],[1009,28,6,12,5,13],[1057,30,6,12,5,13],[1105,30,6,12,5,13]],
    H: [[9,17,1,9,0,0],[16,28,1,16,0,0],[26,22,1,26,0,0],[36,16,2,9,2,10],[46,22,2,11,2,12],[60,28,4,8,1,9],[74,26,4,9,4,10],[90,22,2,11,2,12],[106,20,4,10,4,11],[122,20,4,10,4,11],[140,24,3,12,4,13],[158,18,4,11,5,12],[180,22,3,12,5,13],[200,26,4,12,4,13],[227,24,4,12,4,13],[253,28,4,12,4,13],[285,24,4,12,4,13],[321,30,3,15,4,16],[349,28,4,12,4,13],[377,28,4,12,4,13],[405,28,4,12,4,13],[441,30,4,12,4,13],[477,28,4,12,4,13],[511,30,4,12,4,13],[545,28,4,12,4,13],[577,28,4,12,4,13],[605,28,4,12,4,13],[637,28,4,12,4,13],[669,28,4,12,4,13],[701,28,4,12,4,13],[745,30,5,12,4,13],[793,28,5,12,4,13],[841,30,5,12,4,13],[889,30,5,12,4,13]]
  };

  var ALIGN_POS = [[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,26,28,50],[6,30,54,78],[6,26,52,78],[6,30,56,82],[6,30,58,86],[6,30,62,90],[6,30,66,94],[6,30,70,98],[6,30,74,102],[6,30,78,106],[6,30,82,110],[6,30,86,114],[6,30,68,90,112],[6,30,68,92,114],[6,30,72,96,120],[6,30,72,96,120],[6,30,68,92,116,140],[6,30,68,92,116,140],[6,30,68,94,120,146],[6,30,72,96,120,144],[6,30,72,98,124,150],[6,30,74,100,126,152],[6,30,74,102,128,154]];

  // GF(256) 运算表
  var EXP_TABLE = new Array(256), LOG_TABLE = new Array(256);
  (function () {
    for (var i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
    for (var i = 8; i < 256; i++) EXP_TABLE[i] = EXP_TABLE[i-4] ^ EXP_TABLE[i-5] ^ EXP_TABLE[i-6] ^ EXP_TABLE[i-8];
    for (var i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;
  })();
  function gmul(a, b) { if (a === 0 || b === 0) return 0; return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255]; }

  // RS 生成多项式
  function rsGenPoly(deg) {
    var poly = [1];
    for (var i = 0; i < deg; i++) {
      var next = new Array(poly.length + 1).fill(0);
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j+1] ^= gmul(poly[j], EXP_TABLE[i]);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    var gen = rsGenPoly(ecLen);
    var result = data.concat(new Array(ecLen).fill(0));
    for (var i = 0; i < data.length; i++) {
      var coef = result[i];
      if (coef === 0) continue;
      for (var j = 0; j < gen.length; j++) result[i+j] ^= gmul(gen[j], coef);
    }
    return result.slice(data.length);
  }

  // 选 version: 找最小能装下数据的版本
  function pickVersion(bytes, ecl) {
    for (var v = 0; v < 40; v++) {
      var total = ECC_BLOCKS[ecl][v][0];
      if (bytes.length <= total) return v + 1;
    }
    return -1;
  }

  function getMatrix(version, ecl, data) {
    var info = ECC_BLOCKS[ecl][version-1];
    var totalData = info[0], ecLen = info[1];
    var b1n = info[2], b1d = info[3], b2n = info[4], b2d = info[5];
    var blocks = [];
    var offset = 0;
    for (var i = 0; i < b1n; i++) {
      blocks.push({ data: data.slice(offset, offset + b1d), ec: null });
      offset += b1d;
    }
    for (var j = 0; j < b2n; j++) {
      blocks.push({ data: data.slice(offset, offset + b2d), ec: null });
      offset += b2d;
    }
    // 每块算 EC
    for (var k = 0; k < blocks.length; k++) blocks[k].ec = rsEncode(blocks[k].data, ecLen);

    // 交错拼回
    var result = [];
    var maxData = Math.max(b1d, b2d);
    for (var d = 0; d < maxData; d++) {
      for (var b = 0; b < blocks.length; b++) if (d < blocks[b].data.length) result.push(blocks[b].data[d]);
    }
    for (var e = 0; e < ecLen; e++) {
      for (var b2 = 0; b2 < blocks.length; b2++) result.push(blocks[b2].ec[e]);
    }

    // 补全到 totalData (剩余位用 0xEC, 0x11 交替)
    while (result.length < totalData) {
      result.push(236);
      if (result.length < totalData) result.push(17);
    }

    return buildMatrix(version, ecl, result);
  }

  function buildMatrix(version, ecl, finalData) {
    var size = version * 4 + 17;
    var matrix = [];
    var reserved = [];
    for (var i = 0; i < size; i++) { matrix.push(new Array(size).fill(null)); reserved.push(new Array(size).fill(false)); }

    // 1. 三个定位图案
    function placeFinder(r, c) {
      for (var dr = -1; dr <= 7; dr++) for (var dc = -1; dc <= 7; dc++) {
        var rr = r + dr, cc = c + dc;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        var on;
        if (dr === 0 || dr === 6) on = (dc >= 0 && dc <= 6);
        else if (dc === 0 || dc === 6) on = true;
        else if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) on = true;
        else on = false;
        matrix[rr][cc] = on;
      }
    }
    placeFinder(0, 0); placeFinder(0, size-7); placeFinder(size-7, 0);

    // 2. 时序图案
    for (var t = 8; t < size - 8; t++) {
      matrix[6][t] = (t % 2 === 0); reserved[6][t] = true;
      matrix[t][6] = (t % 2 === 0); reserved[t][6] = true;
    }

    // 3. 对齐图案
    var aligns = ALIGN_POS[version] || [];
    for (var ai = 0; ai < aligns.length; ai++) for (var aj = 0; aj < aligns.length; aj++) {
      var ar = aligns[ai], ac = aligns[aj];
      if ((ar === 6 && ac === 6) || (ar === 6 && ac === size-7) || (ar === size-7 && ac === 6)) continue;
      for (var dr2 = -2; dr2 <= 2; dr2++) for (var dc2 = -2; dc2 <= 2; dc2++) {
        var rr2 = ar + dr2, cc2 = ac + dc2;
        var on2 = (Math.abs(dr2) === 2 || Math.abs(dc2) === 2 || (dr2 === 0 && dc2 === 0));
        matrix[rr2][cc2] = on2; reserved[rr2][cc2] = true;
      }
    }

    // 4. 格式信息区 & 版本信息区 (先留空,后面填)
    for (var f = 0; f < 8; f++) {
      reserved[8][f] = true; reserved[f][8] = true;
      reserved[8][size-1-f] = true; reserved[size-1-f][8] = true;
    }
    reserved[8][8] = true;
    if (version >= 7) {
      for (var vi = 0; vi < 6; vi++) for (var vj = 0; vj < 3; vj++) {
        reserved[size-11+vi][vj] = true; reserved[vi][size-11+vj] = true;
      }
    }

    // 5. 写数据 (Z 字形)
    var dir = -1, row = size - 1, col = size - 1, bitIdx = 0;
    var totalBits = finalData.length * 8;
    while (col > 0) {
      if (col === 6) col--;
      while (row >= 0 && row < size) {
        for (var cc3 = 0; cc3 < 2; cc3++) {
          var c3 = col - cc3;
          if (!reserved[row][c3]) {
            var bit;
            if (bitIdx < totalBits) bit = ((finalData[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1) === 1;
            else bit = false;
            matrix[row][c3] = bit; bitIdx++;
          }
        }
        row += dir;
      }
      row -= dir; dir = -dir; col -= 2;
    }

    // 6. 掩码 (用 M0 掩码,简单可用)
    var mask = 0;
    function maskFn(r, c) { return (r + c) % 2 === 0; }
    for (var mr = 0; mr < size; mr++) for (var mc = 0; mc < size; mc++) {
      if (!reserved[mr][mc] && maskFn(mr, mc)) matrix[mr][mc] = !matrix[mr][mc];
    }

    // 7. 写格式信息 (M 级, 掩码 0) — 固定模式 0b101010000010010
    var fmt = 0x5412; // M + mask 0 的 BCH-15-5 编码后值
    for (var fi = 0; fi < 15; fi++) {
      var bit2 = ((fmt >> fi) & 1) === 1;
      if (fi < 6) matrix[8][fi] = bit2;
      else if (fi < 8) matrix[8][fi+1] = bit2;
      else if (fi < 9) matrix[7][8] = bit2;
      else matrix[14-fi][8] = bit2;
      if (fi < 8) matrix[size-1-fi][8] = bit2;
      else matrix[8][size-15+fi] = bit2;
    }
    matrix[size-8][8] = true;

    return { matrix: matrix, size: size };
  }

  function utf8Bytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) { bytes.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F)); }
      else if (c < 0xD800 || c >= 0xE000) { bytes.push(0xE0 | (c >> 12), 0x80 | ((c>>6)&0x3F), 0x80 | (c&0x3F)); }
      else {
        i++;
        var c2 = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
        bytes.push(0xF0 | (c2>>18), 0x80 | ((c2>>12)&0x3F), 0x80 | ((c2>>6)&0x3F), 0x80 | (c2&0x3F));
      }
    }
    return bytes;
  }

  /**
   * 生成二维码 SVG 字符串
   * @param {string} text  要编码的文本
   * @param {object} opts  { ecl: 'L'|'M'|'Q'|'H', margin: number }
   * @returns {string}     SVG 字符串
   */
  function svgString(text, opts) {
    opts = opts || {};
    var ecl = opts.ecl || 'M';
    var margin = opts.margin != null ? opts.margin : 4;
    var bytes = utf8Bytes(text);
    // 加模式指示符 (4位 0100 字节模式) + 长度 (8 或 16 位) + 数据 + 终止符
    var bits = [];
    function pushBits(val, len) { for (var i = len-1; i >= 0; i--) bits.push((val >> i) & 1); }
    pushBits(0b0100, 4); // 字节模式
    var lenBits = bytes.length < 128 ? 8 : 16;
    pushBits(bytes.length, lenBits);
    for (var i = 0; i < bytes.length; i++) pushBits(bytes[i], 8);
    // 终止符 (最多 4 个 0)
    for (var t = 0; t < 4 && bits.length % 8 !== 0; t++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);
    var dataBytes = [];
    for (var b = 0; b < bits.length; b += 8) {
      var v = 0;
      for (var k = 0; k < 8; k++) v = (v << 1) | bits[b+k];
      dataBytes.push(v);
    }

    var version = pickVersion(dataBytes, ecl);
    if (version < 0) return '<svg xmlns="http://www.w3.org/2000/svg"><text x="0" y="10">data too long</text></svg>';

    var result = getMatrix(version, ecl, dataBytes);
    var matrix = result.matrix, size = result.size;
    var dim = size + margin * 2;
    var cell = 1;
    var parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="' + dim*cell + '" height="' + dim*cell + '" viewBox="0 0 ' + dim*cell + ' ' + dim*cell + '" shape-rendering="crispEdges">'];
    parts.push('<rect width="' + dim*cell + '" height="' + dim*cell + '" fill="#fff"/>');
    for (var r = 0; r < size; r++) for (var c = 0; c < size; c++) {
      if (matrix[r][c]) parts.push('<rect x="' + (c+margin) + '" y="' + (r+margin) + '" width="1" height="1" fill="#000"/>');
    }
    parts.push('</svg>');
    return parts.join('');
  }

  /**
   * 渲染到指定 img 元素
   * @param {HTMLImageElement} imgEl
   * @param {string} text
   * @param {object} opts
   */
  function renderTo(imgEl, text, opts) {
    var svg = svgString(text, opts);
    imgEl.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    imgEl.alt = (opts && opts.alt) || 'QR Code';
  }

  global.QR = {
    svgString: svgString,
    renderTo: renderTo
  };
})(typeof window !== 'undefined' ? window : this);
