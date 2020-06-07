let baseurl = "https://mangakakalot.com"
let urladd1 = "/search/"

let searchstring = "Ake no Tobari"

function regex(str) {
    str.toLowerCase();
    str.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    str.replace(/[èéẹẻẽêềếệểễ]/g, "e")
    str.replace(/[ìíịỉĩ]/g, "i")
    str.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    str.replace(/[ùúụủũưừứựửữ]/g, "u")
    str.replace(/[ỳýỵỷỹ]/g, "y")
    str.replace(/[đ]/g, "d")
    str.replace(/!|@|%|\^|\*|\(|\)|\+|=|<|>|\?|\/|,|\.|:|;|'| |"|&|#|\[|]|~|-|$|_/g, "_")
    str.replace(/_+_/g, "_")
    str.replace(/^_+|_+$/g, "")
}

regex(searchstring)

console.log(searchstring)