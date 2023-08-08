export const FormatDate = (d) => {
    let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    let mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
    let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
    return`${ye}-${mo}-${da}`;
}

export const FormatDateSRED = (d) => {
    let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    let mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d);
    let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
    return`${ye}-${mo}-${da}`;
}

export const FormatDateTime = (d) => {
    let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    let mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
    let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
    let hr = new Intl.DateTimeFormat('en', { hour: '2-digit', hourCycle: 'h24' }).format(d);
    let mn = new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(d);
    let sc = new Intl.DateTimeFormat('en', { second: '2-digit' }).format(d);
    return`${ye}-${mo}-${da}  ${hr}:${mn}:${sc}`;
}


export const FormatTimeCode = (d) => {
    let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    let mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d);
    let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
    let hr = new Intl.DateTimeFormat('en', { hour: '2-digit', hourCycle: 'h24' }).format(d);
    let mn = new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(d);
    let sc = new Intl.DateTimeFormat('en', { second: '2-digit' }).format(d);
    let ms = new Intl.DateTimeFormat('en', { fractionalSecondDigits: '3' }).format(d);
    return`${ye}${mo}${da}${hr}${mn}${sc}${ms}`;
}

export const FormatTimeCodeDashed = (d) => {
    let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    let mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d);
    let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
    let hr = new Intl.DateTimeFormat('en', { hour: '2-digit', hourCycle: 'h24' }).format(d);
    let mn = new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(d);
    let sc = new Intl.DateTimeFormat('en', { second: '2-digit' }).format(d);
    let ms = new Intl.DateTimeFormat('en', { fractionalSecondDigits: '3' }).format(d);
    return`${ye}${mo}${da}-${hr}${mn}${sc}-${ms}`;
}