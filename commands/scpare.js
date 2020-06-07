const axios = require('axios')
const cheerio = require('cheerio')
const download = require('image-downloader')

let arrurl = [];
let arrname = [];

let baseurl = "https://mangakakalot.com"
let urladd1 = "/search/"
let urladd2 = "/chapter/"

let searchstring = "Ake no Tobari"
let chapternr = "/chapter_1"

function regex(searchstring) {
    let str = searchstring.toLowerCase();
    str = str.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    str = str.replace(/[èéẹẻẽêềếệểễ]/g, "e")
    str = str.replace(/[ìíịỉĩ]/g, "i")
    str = str.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    str = str.replace(/[ùúụủũưừứựửữ]/g, "u")
    str = str.replace(/[ỳýỵỷỹ]/g, "y")
    str = str.replace(/[đ]/g, "d")
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|=|<|>|\?|\/|,|\.|:|;|'| |"|&|#|\[|]|~|-|$|_/g, "_")
    str = str.replace(/_+_/g, "_")
    str = str.replace(/^_+|_+$/g, "")
  searchitem(str)
}

regex(searchstring)

function searchitem(str){

    axios.get(baseurl + urladd1 + str).then((response) => {
        const $ = cheerio.load(response.data)
        const urlElems = $('div.panel_story_list')
        
        for (let i = 0; i < urlElems.length; i++) {
          const urlh3 = $(urlElems[i]).find('h3.story_name')[0]
          if (urlh3) {
            //const urltext = $(urlh3).text()
            const urlhtml = $(urlh3).html()
            let urlregex = /"(.*?[^\\])"/g;
            var urlTexttrim = urlregex.exec(urlhtml);
            getchapter(str)
    }
  }
})
}

function getchapter(str) {
  var scrape = function( callback ) {
      axios.get(baseurl + urladd2 + str + chapternr).then((response) => {
        const $ = cheerio.load(response.data)
        const urlElems = $('div.vung-doc')
        
          const urlimg = $(urlElems[0]).find('img')
          if (urlimg) {
            for (let i = 0; i < urlimg.length; i++) {
              arrurl.push(urlimg[i].attribs.src)
              arrname.push(urlimg[i].attribs.title)
            }
    }
    if (callback) callback()
    });
}
scrape(function() {
 
    const options = {
        url: arrurl[0],
        headers: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:72.0) Gecko/20100101 Firefox/72.0",
        dest: '../cache/'
      }
       
      download.image(options)
        .then(({ filename }) => {
          console.log('Saved to', filename)
        })
        .catch((err) => console.error(err))
})
}