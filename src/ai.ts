import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to include too many extra ingredients. Format your response in markdown to make it easier to render to a web page
`

// 🚨👉 ALERT: Read message below! You've been warned! 👈🚨
// If you're following along on your local machine instead of
// here on Scrimba, make sure you don't commit your API keys
// to any repositories and don't deploy your project anywhere
// live online. Otherwise, anyone could inspect your source
// and find your API keys/tokens. If you want to deploy
// this project, you'll need to create a backend of some kind,
// either your own or using some serverless architecture where
// your API calls can be made. Doing so will keep your
// API keys private.


const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export async function getRecipeFromGemini(ingredientsArr: string[]): Promise<string | undefined> {
    const ingredientsString = ingredientsArr.join(", ")

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            systemInstruction: SYSTEM_PROMPT
        })
        const result = await model.generateContent(
            `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!`
        )

        const response = result.response
        return response.text()
    } catch (err) {
        console.error((err as Error).message)
        console.error('Full error:', err)
    }
}
