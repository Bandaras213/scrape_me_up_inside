const axios = require("axios");
const cheerio = require("cheerio");
const download = require("image-downloader");
const fs = require('fs');
const zipFolder = require('zip-a-folder');
const del = require('del');
const readline = require('readline');

let arrurl = [];
let arrname = [];

let baseurl = "https://mangakakalot.com";
let urladd1 = "/search/story/";
let urladd2 = "/chapter/";

let searchstring = process.argv.shift();
searchstring = process.argv.shift();
searchstring = process.argv.join(" ");

let chapternr = "/chapter_1"; //new process.argv promp later with range and shows min max chapters

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

function regexall(searchstring) {
  let str = searchstring.toLowerCase();
  str = str.replace(
    /!|@|%|\^|\*|\(|\)|\+|=|<|>|\?|\/|,|\.|:|;|'| |"|&|#|\[|]|~|-|$|_/g,
    "_"
  );
  str = str.replace(/_+_/g, "_");
  str = str.replace(/^_+|_+$/g, "");
  return searchstring = str
}

function regexall2(searchstring) {
  let str = searchstring.toLowerCase();
  str = str.replace(
    /!|@|%|\^|\*|\(|\)|\+|=|<|>|\?|\/|,|:|;|'| |"|&|#|\[|]|~|-|$|_/g,
    "_"
  );
  str = str.replace(/_+_/g, "_");
  str = str.replace(/^_+|_+$/g, "");
  return searchstring = str
}

regex(searchstring);

function searchitem(str) {
  axios.get(baseurl + urladd1 + str).then(response => {
    const $ = cheerio.load(response.data);
    const urlElems = $("div.panel_story_list");

    for (let i = 0; i < urlElems.length; i++) {
      const urlh3 = $(urlElems[i]).find("h3.story_name")[0];
      if (urlh3) {
        const urlhtmlfull = $(urlh3).find("a")[0].attribs.href;
        let urlfilter = urlhtmlfull.match(/\b(\w*mangakakalot\w*)\b|\b(\w*manganelo\w*)\b/g)
        if (urlfilter[0] == "mangakakalot") {
          getinfos(urlhtmlfull, str, $);
        } else if (urlfilter[0] == "manganelo") {
          getinfosalt(urlhtmlfull, str, $);
        }
      }
    }
  });
}

function getinfos(url, str, $) {
  let newname = str;
  let genrearr = [];
  let newchapterurl;
  let author;
  let name;
  let coverurl;
  let status;
  let description;
  let chapterlist;

  var getinfos1 = function (callback) {
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
      status = $(urlinfos[2]).text();
      status = status.replace("Status : ", "")
      switch (status) {
        case "Ongoing":
          status = 1
          break
        case "Completed":
          status = 2
          break
        case "Unknown":
          status = 0
          break
        case "Licensed":
          status = 3
          break
        default:
          status = 0
          break
      }
      
      let urlinfoElems2 = $("div#noidungm");
      description = urlinfoElems2[0].children[2].data
      description = description.replace(/^\s+/g, '');
      description = description.replace(/(\r\n|\n|\r)/gm," ");
      description = description.replace(/“|”|"/g, "'")

      let genres = $(urlinfos[6]).find("a");
      for (let i = 0; i < genres.length; i++) {
        genrearr.push('"' + genres[i].children[0].data + '"');
      }

      const urlchapElems = $("div.manga-info-chapter");
      const chapterurls = $(urlchapElems[0])
        .find("div.chapter-list")
        .find("div.row")
        .find("a")[0].attribs.href;
      let searchfor = "chapter_";
      let chapterurlsearch = chapterurls.search(searchfor) - 1;
      newchapterurl = chapterurls.substring(0, chapterurlsearch);

      const urlchaplistElems = $("div.manga-info-chapter");
      chapterlist = $(urlchaplistElems[0])
        .find("div.chapter-list")
        .find("div.row").get().reverse()

      if (callback) callback();
    });
  };
  getinfos1(async function () {
      let jsonData = '{"title": "' + name + '", "author": "' + author + '", "description": "' + description + '", "genre": [' + genrearr + '], "status": "' + status + '", "_status values": ["0 = Unknown", "1 = Ongoing", "2 = Completed", "3 = Licensed"]}';
      try {
        if (fs.existsSync("./cache/" + newname)) {
          getchapter(newchapterurl, newname, chapterlist, $);
        } else {
          fs.mkdirSync("./cache/" + newname);
          fs.writeFileSync("./cache/" + newname + "/details.json", jsonData);
          const options = {
            url: coverurl,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:72.0) Gecko/20100101 Firefox/72.0",
              "Accept-Language": "en-gb",
              "Accept-Encoding": "br, gzip, deflate",
              Accept:
                "test/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              Referer: "https://mangakakalot.com"
            },
            dest: "./cache/" + newname + "/cover.jpg"
          };

          await download
          .image(options)
          .then(({ filename }) => {
            console.log("Saved to", filename);
          })
          .catch(err => console.error(err));
          getchapter(newchapterurl, newname, chapterlist, $);
        }
      } catch(err) {
        console.error(err)
      }
});
};

function getchapter(str, newname, chapterlist, $) {

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('What Chapter do you want to Download from ' + chapterlist.length + "?", (answer) => {
  if (answer > chapterlist.length) {
    console.log("Your Answer was not in the Chapter range try again.")
  } else {
    let chapterlistel = $(chapterlist[answer])
    .find("span")
    .find("a")
    .text()
    let searchfor = ":";
    let chaptersearch = chapterlistel.search(searchfor);
    if (chaptersearch == -1) {
    } else {
      chapterdir = chapterlistel.substring(0, chaptersearch);
      chapterlistel = chapterdir
    }

    startscrape(regexall2(chapterlistel), regexall(chapterlistel))
  }
rl.close();
});
function startscrape(answer, answer2) {
  var scrape = function (callback) {
    axios.get(str + "/" + answer).then(response => {
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
  scrape(function () {
      try {
        if (fs.existsSync("./cache/" + newname + "/" + answer2)) {
          console.log("./cache/" + newname + "/" + answer2 + " Already exists")
        } else {
          fs.mkdirSync("./cache/" + newname + "/" + answer2);
        async function scrapandpack() {
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
            dest: "./cache/" + newname + "/" + answer2
          };

         await download
          .image(options)
          .then(({ filename }) => {
            console.log("Saved to", filename);
          })
          .catch(err => console.error(err));
        }
        class ZipAFolder {
 
          static main() {
              zipFolder.zipFolder("./cache/" + newname + "/" + answer2, "./cache/" + newname + "/" + answer2 + ".zip", function(err) {
                  if(err) {
                      console.log('Something went wrong!', err);
                  } else {
                    del.sync(["./cache/" + newname + "/" + answer2, "!./cache/" + newname]);
                  }
              });
          }
        }
        
        ZipAFolder.main();
      }
      scrapandpack();
    }
      } catch(err) {
        console.error(err)
      }
    });
}
}

function getinfosalt(url, str, $) {
  let newname = str;
  let genrearr = [];
  let newchapterurl;
  let author;
  let name;
  let alternative;
  let coverurl;
  let status;
  let description;

  var getinfos1 = function (callback) {
    axios.get(url).then(response => {
      const $ = cheerio.load(response.data);
      const urlinfoElems = $("div.panel-story-info");
     const urlinfoimg = $(urlinfoElems[0])
        .find("img.img-loading")
      coverurl = urlinfoimg[0].attribs.src;

      let urlinfos = $(urlinfoElems[0])
        .find("div.story-info-right")
      name = $(urlinfos[0])
        .find("h1")
        .text();

      let alttemp = $(urlinfos[0])
      .find("table.variations-tableInfo")
      .find("td.table-value")[0]
      alternative = $(alttemp)
      .find("h2")
      .text();

      let altauthor = $(urlinfos[0])
      .find("table.variations-tableInfo")
      .find("td.table-value")[1]
      author = $(altauthor)
      .find("a")
      .text();

      let altstatus = $(urlinfos[0])
      .find("table.variations-tableInfo")
      .find("td.table-value")[2]
      status = $(altstatus)
      .text();
      status = status.replace("Status : ", "")
      switch (status) {
        case "Ongoing":
          status = 1
          break
        case "Completed":
          status = 2
          break
        case "Unknown":
          status = 0
          break
        case "Licensed":
          status = 3
          break
        default:
          status = 0
          break
      }
      
      let urlinfoElems2 = $("div.panel-story-info-description")
      description = urlinfoElems2[0].children[2].data
      description = description.replace(/^\s+/g, '');
      description = description.replace(/(\r\n|\n|\r)/gm," ");
      description = description.replace(/“|”|"/g, "'")

      let altgenres = $(urlinfos[0])
      .find("table.variations-tableInfo")
      .find("td.table-value")[3]
      let genres = $(altgenres)
      .find("a")
      for (let i = 0; i < genres.length; i++) {
        genrearr.push('"' + genres[i].children[0].data + '"');
      }

      const urlchapElems = $("div.panel-story-chapter-list");
      const chapterurls = $(urlchapElems[0])
        .find("ul.row-content-chapter")
        .find("li.a-h")
        .find("a")[0].attribs.href;
      let searchfor = "chapter_";
      let chapterurlsearch = chapterurls.search(searchfor) - 1;
      newchapterurl = chapterurls.substring(0, chapterurlsearch);

      const urlchaplistElems = $("div.panel-story-chapter-list");
      chapterlist = $(urlchaplistElems[0])
      .find("ul.row-content-chapter")
      .find("li.a-h").get().reverse()

      if (callback) callback();
    });
  };
  getinfos1(async function () {
      let jsonData = '{"title": "' + name + '", "author": "' + author + '", "description": "' + description + '", "genre": [' + genrearr + '], "status": "' + status + '", "_status values": ["0 = Unknown", "1 = Ongoing", "2 = Completed", "3 = Licensed"]}';
      try {
        if (fs.existsSync("./cache/" + newname)) {
          getchapter1(newchapterurl, newname, chapterlist, $);
        } else {
          fs.mkdirSync("./cache/" + newname);
          fs.writeFileSync("./cache/" + newname + "/details.json", jsonData);
          const options = {
            url: coverurl,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:72.0) Gecko/20100101 Firefox/72.0",
              "Accept-Language": "en-gb",
              "Accept-Encoding": "br, gzip, deflate",
              Accept:
                "test/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              Referer: "https://mangakakalot.com"
            },
            dest: "./cache/" + newname + "/cover.jpg"
          };

         await download
          .image(options)
          .then(({ filename }) => {
            console.log("Saved to", filename);
          })
          .catch(err => console.error(err));
          getchapter1(newchapterurl, newname, chapterlist, $);
        }
      } catch(err) {
        console.error(err)
      }
});
};

function getchapter1(str, newname, chapterlist, $) {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('What Chapter do you want to Download from ' + chapterlist.length + "?", (answer) => {
    if (answer > chapterlist.length) {
      console.log("Your Answer was not in the Chapter range try again.")
    } else {
      let chapterlistel = $(chapterlist[answer])
      .find("a")
      .text()
      let searchfor = ":";
      let chaptersearch = chapterlistel.search(searchfor);
      if (chaptersearch == -1) {
      } else {
        chapterdir = chapterlistel.substring(0, chaptersearch);
        chapterlistel = chapterdir
      }

      startscrape(regexall2(chapterlistel), regexall(chapterlistel))
    }
  rl.close();
  });
  function startscrape(answer, answer2) {
  var scrape = function (callback) {
    axios.get(str  + "/" + answer).then(response => {
      const $ = cheerio.load(response.data);
      const urlElems = $("div.container-chapter-reader");

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
  scrape(function () {
    try {
      if (fs.existsSync("./cache/" + newname + "/" + answer2)) {
        console.log("./cache/" + newname + "/" + answer2 + " Already exists")
      } else {
        fs.mkdirSync("./cache/" + newname + "/" + answer2);
      async function scrapandpack() {
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
          dest: "./cache/" + newname + "/" + answer2
        };

       await download
        .image(options)
        .then(({ filename }) => {
          console.log("Saved to", filename);
        })
        .catch(err => console.error(err));
      }
      class ZipAFolder {

        static main() {
            zipFolder.zipFolder("./cache/" + newname + "/" + answer2, "./cache/" + newname + "/" + answer2 + ".zip", function(err) {
                if(err) {
                    console.log('Something went wrong!', err);
                } else {
                  del.sync(["./cache/" + newname + "/" + answer2, "!./cache/" + newname]);
                }
            });
        }
      }
      
        ZipAFolder.main();
      }
      scrapandpack();
    }
      } catch(err) {
        console.error(err)
      }
    });
}
}