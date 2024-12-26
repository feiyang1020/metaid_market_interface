import Compressor from "compressorjs";
import CryptoJs from "crypto-js";
import encHex from "crypto-js/enc-hex";
import BigNumber from "bignumber.js";
import { getIntl, getLocale } from "umi";
export enum IsEncrypt {
  Yes = 1,
  No = 0,
}
export interface AttachmentItem {
  fileName: string;
  fileType: string;
  data: string;
  encrypt: IsEncrypt;
  sha256: string;
  size: number;
  url: string;
}
export async function compressImage(image: File) {
  const compress = (quality: number): Promise<File> =>
    new Promise((resolve, reject) => {
      new Compressor(image, {
        quality,
        convertSize: 100_000, // 100KB
        success: resolve as () => File,
        error: reject,
      });
    });

  // Use 0.6 compression ratio first; If the result is still larger than 1MB, use half of the compression ratio; Repeat 5 times until the result is less than 1MB, otherwise raise an error
  let useQuality = 0.6;
  for (let i = 0; i < 5; i++) {
    const compressed = await compress(useQuality);
    if (compressed.size < 1_000_000) {
      return compressed;
    }
    useQuality /= 2;
  }

  throw new Error("Image is too large");
}

// 降文件转为 AttachmentItem， 便于操作/上链
export function FileToAttachmentItem(
  file: File,
  encrypt: IsEncrypt = IsEncrypt.No
) {
  return new Promise<AttachmentItem>(async (resolve) => {
    function readResult(blob: Blob) {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          // @ts-ignore
          const wordArray = CryptoJs.lib.WordArray.create(reader.result);
          // @ts-ignore
          const buffer = Buffer.from(reader.result);
          // console.log("buffer", buffer, reader.result);
          hex += buffer.toString("hex"); // 更新hex
          // 增量更新计算结果
          sha256Algo.update(wordArray); // 更新hash
          resolve();
        };
        reader.readAsArrayBuffer(blob);
      });
    }
    // 分块读取，防止内存溢出，这里设置为20MB,可以根据实际情况进行配置
    const chunkSize = 20 * 1024 * 1024;

    let hex = ""; // 二进制
    const sha256Algo = CryptoJs.algo.SHA256.create();

    for (let index = 0; index < file.size; index += chunkSize) {
      await readResult(file.slice(index, index + chunkSize));
    }
    resolve({
      data: hex,
      fileName: file.name,
      fileType: file.type,
      sha256: encHex.stringify(sha256Algo.finalize()),
      url: URL.createObjectURL(file),
      encrypt,
      size: file.size,
    });
  });
}
export const image2Attach = async (images: FileList) => {
  const attachments: AttachmentItem[] = [];

  for (let i = 0; i < images.length; i++) {
    // 压缩图片
    const compressed = await compressImage(images[i]);
    const result = await FileToAttachmentItem(compressed);
    if (result) attachments.push(result);
    // if (attachments.length <= 3) {
    // } else {
    //  break;
    // }
  }
  return attachments;
};

export function determineAddressInfo(address: string): string {
  if (address.startsWith("bc1q")) {
    return "p2wpkh";
  }
  if (address.startsWith("tb1q")) {
    return "p2wpkh";
  }

  if (address.startsWith("bc1p")) {
    return "p2tr";
  }

  if (address.startsWith("tb1p")) {
    return "p2tr";
  }

  if (address.startsWith("1")) {
    return "p2pkh";
  }
  if (address.startsWith("3") || address.startsWith("2")) {
    return "p2sh";
  }
  if (address.startsWith("m") || address.startsWith("n")) {
    return "p2pkh";
  }
  return "unknown";
}

export const formatSat = (value: string | number, dec = 8) => {
  if (!value) return "0";

  const v = BigNumber(value).div(Math.pow(10, dec));
  const arr = v.toString().split(".");
  if (v.toString().indexOf("e") > -1 || (arr[1] && arr[1].length > dec)) {
    return BigNumber(v).toFixed(dec);
  }
  return v.toString();
};

export function formatNumberToKMBT(num: number, digits: number = 2) {
  const si: { value: number; symbol: string }[] = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "m" },
    { value: 1e9, symbol: "b" },
    { value: 1e12, symbol: "t" },
    { value: 1e15, symbol: "p" },
    { value: 1e18, symbol: "e" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
}

export const bigint2Number = (value: any, unit: number) => {
  return formatSat(value.toString(), unit);
};
export const handlePrecent = (value: number) => {
  return Math.floor(value * 100) / 100;
};

export const openWindowTarget = () => {
  if (window.innerWidth > 768) {
    return "_blank";
  }
  return "_self";
};

export const switchAvatarToMetaDataIcon = (avatar: string) => {
  if (avatar) {
    let pinId = avatar.replace("/content/", "");
    return JSON.stringify({ icon: "metafile://" + pinId });
  }
  return "";
};

export const formatMessage = (children:string) => {
  const intl = getIntl(getLocale());
  return intl.formatMessage({
    id: children,
    defaultMessage: children,
  });
};
