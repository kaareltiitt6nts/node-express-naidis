import express from "express"
import axios from "axios"
import fs from "fs/promises"

const app = express()
const PORT = 3000

app.use(express.static("public"))

// andmete laadimine fakestoreapist ja faili salvestamine
const fetchAndSaveProducts = async () => {
    const response = await axios.get('https://fakestoreapi.com/products');
    const products = response.data;
    await fs.writeFile('./data/products.json', JSON.stringify(products, null, 2));
};

const fetchProductById = async (productId) => {
    const path = "./data/products.json"
    if (isFileEmpty(path)) {
        await fetchAndSaveProducts()
    }

    const rawData = await fs.readFile(path, "utf-8")
    const json = JSON.parse(rawData)
    const product = json.find((product) => {return product.id === productId})

    return product
}

// kas fail on tyhi
const isFileEmpty = async (path) => {
    try {
        const rawData = await fs.readFile(path, 'utf-8');
        return !rawData.trim(); // kas fail on tyhi
    } catch (error) {
        console.error('Viga faili lugemisel', error);
        return true; // fail on tyhi v6i puudub
    }
};

app.get('/products', async (req, res) => {
    try {
        const filePath = './data/products.json';

        // Kontrolli, kas fail on tühi
        const emptyFile = await isFileEmpty(filePath);

        // Kui fail on tühi, lae andmed API-st ja salvesta need
        if (emptyFile) {
            console.log('Fail on tühi. Laadin andmed FakeStore API-st...');
            await fetchAndSaveProducts();
        }

        // Loe andmed failist
        const rawData = await fs.readFile(filePath, 'utf-8');

        // Parssige andmed
        const products = JSON.parse(rawData);

        // Seadista vastuse päised
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

        // Tagasta andmed kasutajale
        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Andmete lugemine ebaõnnestus' });
    }
});

app.get("/product/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        const product = await fetchProductById(id)

        res.status(200).json(product);
    }
    catch(error) {
        console.error(error)
        res.status(500).json({ error: "toote leidmine eba6nnestus" });
    }
})


// API: Käsitsi andmete uuesti laadimine ja faili salvestamine
app.get('/fetch-products', async (req, res) => {
    try {
        await fetchAndSaveProducts();
        res.status(200).json({ message: 'Andmed salvestatud products.json faili' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Andmete laadimine ebaõnnestus' });
    }
});

app.listen(PORT, () => {
    console.log(`Server funkab: http://localhost:${PORT}`);
})