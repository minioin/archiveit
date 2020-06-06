const ignoreProtocols = [
    "file://",
    "tel:",
    "about:",
    "http://localhost",
    "https://localhost",
    "http://127.0.0.1",
]

function isBlacklisted(url) {
    for(let protocol of ignoreProtocols) {
        if(url.startsWith(protocol))
            return true;
    }
    return false;
}

async function getLastModified(url) {
    try {
        let res = await fetch(url, {method: 'head'})
        return new Date(res.headers.get("Last-Modified"))
    } catch(e) {
        console.error("Couldn't fetch last updated time of", url, e)
        return new Date();
    }
}

async function archiveAndUpdate(url) {
    console.info("Archiving ", url)
    let lastModified = await getLastModified(url);
    let lastArchived = await browser.storage.local.get(url);;

    console.info("Last archived on ", lastArchived[url])
    console.info("Last modified on ", new Date(lastModified))
    if(lastArchived && new Date(lastArchived[url]).getTime() >= lastModified ) {
        console.info("Already up to date.")
        return;
    }

    console.log("Archiving.")
    let enabledServers = getEnabledServers();
    try {
        let res = await fetch("https://web.archive.org/save/" + url, {method: 'head'})
        if(res.ok && res.status === 200) {
            let object = {}
            object[url] = lastModified
            await browser.storage.local.set(object)
        }
    } catch(e) {
        console.error(e)
    }
}

browser.bookmarks.onCreated.addListener(onBookmarked)
async function onBookmarked(id, bookmark) {
    let {title, url, dateAdded } = bookmark;
    if(!url || isBlacklisted(url)){
        return;
    }
    return await archiveAndUpdate(url)
}
