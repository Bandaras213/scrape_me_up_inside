const axios = require("axios");
const cheerio = require("cheerio");
const download = require("image-downloader");

let arrurl = [];
let arrname = [];

let baseurl = "https://mangakakalot.com";
let urladd1 = "/search/story/";
let urladd2 = "/chapter/";

let searchstring = process.argv.shift();
searchstring = process.argv.shift();
searchstring = process.argv.join(" ");

let chapternr = "/chapter_1"; //process.argv[3] later with range

function regex(searchstring) {
  let str = searchstring.toLowerCase();
  str = str.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a");
  str = str.replace(/[èéẹẻẽêềếệểễ]/g, "e");
  str = str.replace(/[ìíịỉĩ]/g, "i");
  str = str.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o");
  str = str.replace(/[ùúụủũưừứựửữ]/g, "u");
  str = str.replace(/[ỳýỵỷỹ]/g, "y");
  str = str.replace(/[đ]/g, "d");
  str = str.replace(
    /!|@|%|\^|\*|\(|\)|\+|=|<|>|\?|\/|,|\.|:|;|'| |"|&|#|\[|]|~|-|$|_/g,
    "_"
  );
  str = str.replace(/_+_/g, "_");
  str = str.replace(/^_+|_+$/g, "");
  searchitem(str);
}

regex(searchstring);

function searchitem(str) {
  axios.get(baseurl + urladd1 + str).then(response => {
    const $ = cheerio.load(response.data);
    const urlElems = $("div.panel_story_list");

    for (let i = 0; i < urlElems.length; i++) {
      const urlh3 = $(urlElems[i]).find("h3.story_name")[0];
      if (urlh3) {
        //const urltext = $(urlh3).text()
        const urlhtml = $(urlh3).html();
        let urlregex = /"(.*?[^\\])"/g;
        var urlTexttrim = urlregex.exec(urlhtml);
        getinfos(urlTexttrim[1]);
      }
    }
  });
}

function getinfos(url) {
  let genrearr = [];
  let newchapterurl;
  let author;
  let name;
  let coverurl;
  
  var getinfos1 = function(callback) {
    axios.get(url).then(response => {
      const $ = cheerio.load(response.data);
      const urlinfoElems = $("div.manga-info-top");
      const urlinfoimg = $(urlinfoElems[0])
        .find("div.manga-info-pic")
        .find("img")[0];
      coverurl = urlinfoimg.attribs.src;
      
      let urlinfos = $(urlinfoElems[0])
        .find("ul.manga-info-text")
        .find("li");
      name = $(urlinfos[0])
        .find("h1")
        .text();
      author = $(urlinfos[1])
        .find("a")
        .text();
      let status = $(urlinfos[2]).text();
      let genres = $(urlinfos[6]).find("a");
      for (let i = 0; i < genres.length; i++) {
        genrearr.push(genres[i].children[0].data);
      }

      const urlchapElems = $("div.manga-info-chapter");
      const chapterurls = $(urlchapElems[0])
        .find("div.chapter-list")
        .find("div.row")
        .find("a")[0].attribs.href;
      let searchfor = "chapter_";
      let chapterurlsearch = chapterurls.search(searchfor) - 1;
      newchapterurl = chapterurls.substring(0, chapterurlsearch);

      if (callback) callback();
    });
  };
  getinfos1(function() {
    getchapter(newchapterurl);
  });
}

function getchapter(str) {
  var scrape = function(callback) {
    axios.get(str + chapternr).then(response => {
      const $ = cheerio.load(response.data);
      const urlElems = $("div.vung-doc");

      const urlimg = $(urlElems[0]).find("img");
      if (urlimg) {
        for (let i = 0; i < urlimg.length; i++) {
          arrurl.push(urlimg[i].attribs.src);
          arrname.push(urlimg[i].attribs.title);
        }
      }
      if (callback) callback();
    });
  };
  scrape(function() {
    for (let i = 0; i < arrurl.length; i++) {
      const options = {
        url: arrurl[i],
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:72.0) Gecko/20100101 Firefox/72.0",
          "Accept-Language": "en-gb",
          "Accept-Encoding": "br, gzip, deflate",
          Accept:
            "test/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          Referer: "https://mangakakalot.com"
        },
        dest: "./cache/"
      };

      download
        .image(options)
        .then(({ filename }) => {
          console.log("Saved to", filename);
        })
        .catch(err => console.error(err));
    }
  });
}
