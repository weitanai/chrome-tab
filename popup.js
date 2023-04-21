let tabs = [];

async function genTabElement() {
    try {
        tabs = await chrome.tabs.query({
            url: [
                "https://*/*",
            ],
        });

        const collator = new Intl.Collator();
        tabs.sort((a, b) => collator.compare(a.title, b.title));

        const template = document.getElementById("li_template");
        const elements = new Set();
        for (const tab of tabs) {
            const element = template.content.firstElementChild.cloneNode(true);

            const title = tab.title.split("-")[0].trim();
            const pathname = new URL(tab.url).pathname;

            element.querySelector(".title").textContent = title;
            element.querySelector(".pathname").textContent = pathname;
            element.querySelector("a").addEventListener("click", async () => {
                // need to focus window as well as the active tab
                await chrome.tabs.update(tab.id, { active: true });
                await chrome.windows.update(tab.windowId, { focused: true });
            });

            elements.add(element);
        }
        document.querySelector("ul").append(...elements);

    } catch (error) {
        console.error(error);
    }
}

genTabElement()
    .then(console.log)
    .catch(console.error);

const button = document.querySelector("button");
button.addEventListener("click", async () => {
    const tabIds = tabs.map(({ id }) => id);
    await chrome.tabs.group({ tabIds });
});