const phonePattern=/(?:\+?1[.\-\s]?)?\(?\d{3}\)?[.\-\s]?\d{3}[.\-\s]?\d{4}/g;

/** @param {string} text */
export function findPhoneNumbers(text){
  /** @type {string[]} */
  const found=[];
  for(const match of text.matchAll(phonePattern)){
    const value=match[0],start=match.index,end=start+value.length;
    if(/[\w]/.test(text[start-1]||'')||/[\w]/.test(text[end]||''))continue;
    let left=start,right=end;
    while(left>0&&/[\d.\-\s()]/.test(text[left-1]))left--;
    while(right<text.length&&/[\d.\-\s()]/.test(text[right]))right++;
    if(text.slice(left,right).replace(/\D/g,'').length>11)continue;
    const digits=value.replace(/\D/g,'');
    if(digits.length!==10&&!(digits.length===11&&digits.startsWith('1')))continue;
    if(!found.includes(value))found.push(value);
  }
  return found;
}
