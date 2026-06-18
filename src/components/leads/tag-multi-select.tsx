"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { createTagAction } from "@/lib/actions/tags";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types";

interface TagMultiSelectProps {
  workspaceTags: Tag[];
  selected: Tag[];
  onChange: (tags: Tag[]) => void;
}

export function TagMultiSelect({ workspaceTags, selected, onChange }: TagMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState<Tag[]>(workspaceTags);
  const [creating, setCreating] = useState(false);

  const selectedIds = new Set(selected.map((t) => t.id));
  const exactMatch = tags.some((t) => t.name.toLowerCase() === search.trim().toLowerCase());

  function toggleTag(tag: Tag) {
    if (selectedIds.has(tag.id)) {
      onChange(selected.filter((t) => t.id !== tag.id));
    } else {
      onChange([...selected, tag]);
    }
  }

  function removeTag(tagId: string) {
    onChange(selected.filter((t) => t.id !== tagId));
  }

  async function handleCreate() {
    const name = search.trim();
    if (!name || creating) return;
    setCreating(true);
    const result = await createTagAction(name);
    setCreating(false);
    if ("tag" in result) {
      setTags((prev) => [...prev, result.tag]);
      onChange([...selected, result.tag]);
      setSearch("");
    }
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            Selecionar tags
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar ou criar tag..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {search.trim() ? (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Criar &quot;{search.trim()}&quot;
                  </button>
                ) : (
                  "Nenhuma tag encontrada."
                )}
              </CommandEmpty>
              <CommandGroup>
                {tags
                  .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
                  .map((tag) => (
                    <CommandItem key={tag.id} value={tag.name} onSelect={() => toggleTag(tag)}>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedIds.has(tag.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
                {search.trim() && !exactMatch && (
                  <CommandItem onSelect={handleCreate} disabled={creating}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar &quot;{search.trim()}&quot;
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1">
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
