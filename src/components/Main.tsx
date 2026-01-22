import { useState, useRef, useEffect } from "react"
import { stringSimilarity } from "string-similarity-js"
import Recipe from "./Recipe"
import IngredientsList from "./IngredientsList"
import { getRecipeFromGemini } from "../ai"

const SIMILARITY_THRESHOLD = 0.8
const MAX_EDIT_DISTANCE_RATIO = 0.35

interface SimilarIngredient {
    pending: string
    existing: string
}

function damerauLevenshteinDistance(a: string, b: string): number {
    const lenA = a.length
    const lenB = b.length
    const matrix: number[][] = []

    for (let i = 0; i <= lenB; i++) {
        matrix[i] = [i]
    }
    for (let j = 0; j <= lenA; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= lenB; i++) {
        for (let j = 1; j <= lenA; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            )
            // Transposition: swapping two adjacent characters counts as 1 edit
            if (i > 1 && j > 1 && a[j - 1] === b[i - 2] && a[j - 2] === b[i - 1]) {
                matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1)
            }
        }
    }

    return matrix[lenB][lenA]
}

const LOADING_MESSAGES = [
    "Raiding the pantry for ideas...",
    "Mixing flavors in my mind...",
    "Searching for the perfect recipe...",
    "Preheating the creative oven...",
    "Tasting virtual ingredients...",
    "Almost ready to serve...",
]

const STORAGE_KEY = "chef-gemini-ingredients"

export default function Main() {
    const [ingredients, setIngredients] = useState<string[]>([])
    const [recipe, setRecipe] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [similarWarning, setSimilarWarning] = useState<SimilarIngredient | null>(null)

    const recipeSection = useRef(null)

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            setIngredients(JSON.parse(saved))
            localStorage.removeItem(STORAGE_KEY)
        }
    }, [])

    useEffect(() => {
        if (recipe !== "" && recipeSection.current !== null) {
            (recipeSection.current as HTMLDivElement).scrollIntoView({ behavior: "smooth" })
        }
    }, [recipe])

    useEffect(() => {
        if (!isLoading) return

        const interval = setInterval(() => {
            setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
        }, 2000)

        return () => clearInterval(interval)
    }, [isLoading])

    function findSimilarIngredient(newIngredient: string): string | null {
        const normalized = newIngredient.trim().toLowerCase()
        for (const existing of ingredients) {
            const existingNormalized = existing.trim().toLowerCase()
            if (normalized === existingNormalized) {
                return existing
            }

            const similarity = stringSimilarity(normalized, existingNormalized)
            if (similarity >= SIMILARITY_THRESHOLD) {
                return existing
            }

            const maxLen = Math.max(normalized.length, existingNormalized.length)
            const editDistance = damerauLevenshteinDistance(normalized, existingNormalized)
            if (editDistance / maxLen <= MAX_EDIT_DISTANCE_RATIO) {
                return existing
            }
        }
        return null
    }

    function addIngredient(formData: FormData) {
        const newIngredient = (formData.get("ingredient") as string).trim()
        if (!newIngredient) return

        const similar = findSimilarIngredient(newIngredient)
        if (similar) {
            setSimilarWarning({ pending: newIngredient, existing: similar })
            return
        }

        setSimilarWarning(null)
        setIngredients(prev => [...prev, newIngredient])
    }

    function confirmAddIngredient() {
        if (similarWarning) {
            setIngredients(prev => [...prev, similarWarning.pending])
            setSimilarWarning(null)
        }
    }

    function dismissSimilarWarning() {
        setSimilarWarning(null)
    }

    function displaySection() {
        return (
            ingredients.length > 0 && <IngredientsList ref={recipeSection} ingredients={ingredients} showRecipe={showRecipe} />
        )
    }

    async function showRecipe() {
        setIsLoading(true)
        setLoadingMessageIndex(0)
        setError(null)
        try {
            const recipeMarkdown = await getRecipeFromGemini(ingredients)
            if (recipeMarkdown) {
                setRecipe(recipeMarkdown)
            }
        } catch {
            setError("Failed to generate recipe. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    function handleTryAgain() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients))
        window.location.reload()
    }

    return (
        <main>
            <form action={addIngredient} className="add-ingredient-form">
                <input
                    aria-label="Add ingredient"
                    type="text"
                    placeholder="e.g. oregano"
                    name="ingredient"
                />
                <button>Add Ingredient</button>
            </form>

            {similarWarning && (
                <div className="similar-warning" aria-live="polite">
                    <p>
                        "{similarWarning.pending}" looks similar to "{similarWarning.existing}" already in your list.
                    </p>
                    <div className="similar-warning-actions">
                        <button type="button" onClick={confirmAddIngredient}>Add anyway</button>
                        <button type="button" onClick={dismissSimilarWarning}>Cancel</button>
                    </div>
                </div>
            )}

            {displaySection()}

            {isLoading && (
                <div className="loading-container" aria-live="polite">
                    <div className="loading-spinner" />
                    <p className="loading-message">{LOADING_MESSAGES[loadingMessageIndex]}</p>
                </div>
            )}

            {error && (
                <div className="error-container" aria-live="assertive">
                    <p className="error-message">{error}</p>
                    <button type="button" onClick={handleTryAgain}>Try Again</button>
                </div>
            )}

            {recipe && <Recipe recipe={recipe} />}
        </main>
    )
}
