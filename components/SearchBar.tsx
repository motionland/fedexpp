import { useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
    onSearch: (query: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps){
    const [query, setQuery] = useState("")

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value)
        onSearch(event.target.value)
    }

    return (
        <div className="mb-4 relative">
            <input 
                type="text"
                placeholder="Search tracking number or destination..."
                value={query}
                onChange={handleChange}
                className="w-full p-2 pl-10 border-2 border-black rounded-lg"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        </div>
    )
}