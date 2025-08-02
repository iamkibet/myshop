import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface ComboboxProps {
    options: string[]
    value: string
    onValueChange: (value: string) => void
    placeholder: string
    emptyText: string
    createText: string
    onCreateNew?: (value: string) => void
    disabled?: boolean
    className?: string
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder,
    emptyText,
    createText,
    onCreateNew,
    disabled = false,
    className,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")

    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(searchValue.toLowerCase())
    )

    const handleSelect = (currentValue: string) => {
        console.log('Selecting:', currentValue)
        onValueChange(currentValue)
        setOpen(false)
        setSearchValue("")
    }

    const handleCreateNew = () => {
        console.log('Creating new:', searchValue.trim())
        if (searchValue.trim() && onCreateNew) {
            onCreateNew(searchValue.trim())
            setSearchValue("")
            setOpen(false)
        }
    }

    const isCreateOptionVisible = searchValue.trim() && 
        !options.some(option => 
            option.toLowerCase() === searchValue.toLowerCase()
        )

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                    disabled={disabled}
                >
                    {value || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <div className="p-2">
                    <Input
                        placeholder={`Search ${placeholder.toLowerCase()}...`}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="mb-2"
                    />
                    <div className="max-h-[200px] overflow-y-auto">
                        {filteredOptions.length === 0 && searchValue === "" ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                {emptyText}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredOptions.map((option) => (
                                    <button
                                        key={option}
                                        className={cn(
                                            "flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                                            value === option && "bg-accent text-accent-foreground"
                                        )}
                                        onClick={() => handleSelect(option)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === option ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {option}
                                    </button>
                                ))}
                                {isCreateOptionVisible && (
                                    <button
                                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent hover:text-accent-foreground"
                                        onClick={handleCreateNew}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {createText} "{searchValue}"
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
} 