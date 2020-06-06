const blacklistedHostName = [
    "localhost",
    "127.0.0.1",
    "facebook.com",
]
const blacklistedProtocol = [
]

function isValidUrl(url) {
    try {
        url = new URL(url)
        return !blacklistedHostName.includes(url.hostname)
                && ! blacklistedProtocol.includes(url.protocol)
    } catch(e) {
        console.error("Invalid url: ", url)
        console.error(e)
        return false;
    }
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

function archive_org(url) {
  return fetch(`https://web.archive.org/save/${url}`, {method: 'head'})
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
    try {
        let res = await archive_org(url)
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
    if(!url || !isValidUrl(url)){
        return;
    }
    return await archiveAndUpdate(url)
}
