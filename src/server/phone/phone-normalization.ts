function arabicDigitToAscii(codePoint: number) {
  if (codePoint >= 0x0660 && codePoint <= 0x0669) {
    return String(codePoint - 0x0660);
  }
  if (codePoint >= 0x06f0 && codePoint <= 0x06f9) {
    return String(codePoint - 0x06f0);
  }
  return null;
}

export function canonicalPhone(value: string | null | undefined) {
  let digits = "";
  for (const char of value ?? "") {
    const codePoint = char.codePointAt(0);
    const asciiDigit = codePoint === undefined ? null : arabicDigitToAscii(codePoint);
    if (asciiDigit !== null) {
      digits += asciiDigit;
      continue;
    }
    if (char >= "0" && char <= "9") {
      digits += char;
    }
  }

  if (!digits) {
    return null;
  }

  const withoutInternationalPrefix = digits.startsWith("00") ? digits.slice(2) : digits;
  if (/^01\d{9}$/.test(withoutInternationalPrefix)) {
    return `20${withoutInternationalPrefix.slice(1)}`;
  }

  return withoutInternationalPrefix;
}

export function canonicalPhoneForSearch(value: string | null | undefined) {
  return canonicalPhone(value) ?? undefined;
}
