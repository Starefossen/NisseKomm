"use client";

import { useState, useMemo } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { FilNode, Oppdrag } from "@/types/innhold";
import { StorageManager } from "@/lib/storage";
import { isDayCompleted } from "@/lib/oppdrag";

interface NisseNetUtforskerProps {
  files: FilNode[];
  missions: Oppdrag[];
  currentDay: number;
  onClose: () => void;
}

export function NisseNetUtforsker({
  files,
  missions,
  currentDay,
  onClose,
}: NisseNetUtforskerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["root"]),
  );
  const [selectedFile, setSelectedFile] = useState<FilNode | null>(null);

  // Generate dynamic diary content based on current day
  const generateDiaryContent = useMemo(() => {
    if (currentDay < 1 || currentDay > 24) {
      return "JULIUS' DAGBOK\n==================\n\nDag 0 - Før Julen Starter\n\nHei! Dette er Julius som skriver fra Snøfall. Jeg har bestemt meg for å føre dagbok over desember måned. Rampenissen har reist ned til barna for å hjelpe dem med årets julekalender.\n\nHer i Snøfall forbereder vi oss på den travleste tiden på året. Nissene er klare, reinsdyrene er (mer eller mindre) motiverte, og Nissemor har bakt nok pepperkaker til å fø en hær.\n\nSnart begynner den magiske tiden. Gleder meg!\n\n- Julius\n\nPS: Rudolf har allerede begynt å klage. Det er ikke engang desember ennå.";
    }

    let diary =
      "JULIUS' DAGBOK\n==================\n\nSkrevet av Julius fra Snøfall\n\n";

    // Show all entries up to current day
    for (let day = 1; day <= currentDay; day++) {
      const mission = missions.find((m) => m.dag === day);
      if (mission && mission.dagbokinnlegg) {
        diary += "\n" + mission.dagbokinnlegg + "\n\n---\n";
      }
    }

    diary += "\n\n[Dagboken oppdateres hver dag gjennom desember]";

    return diary;
  }, [missions, currentDay]);

  // Process files and inject dynamic content for nissens_dagbok.txt and snill_slem_liste.txt
  const processedFiles = useMemo(() => {
    const generateHintsContent = (maxDay: number): string => {
      let content =
        "🔍 HINT ARKIV\n========================================\n\n";
      content += "Her finner du hint til alle oppdragene!\n";
      content += "Hintene låses opp etter hvert som du fullfører dagene.\n\n";
      content += "---\n\n";

      // Generate hints for each day up to maxDay
      for (let day = 1; day <= Math.min(maxDay, 24); day++) {
        const mission = missions.find((m) => m.dag === day);
        if (mission && mission.fysisk_ledetekst) {
          content += `Dag ${day}: ${mission.fysisk_ledetekst}\n`;
        }
      }

      if (maxDay < 24) {
        content +=
          "\n[Flere hint låses opp etter hvert som dere fullfører flere dager]";
      }

      return content;
    };

    const processNode = (node: FilNode): FilNode => {
      if (node.type === "fil" && node.navn === "nissens_dagbok.txt") {
        return {
          ...node,
          innhold: generateDiaryContent,
        };
      }

      // Generate hint content dynamically up to current day
      if (node.type === "fil" && node.navn === "hint_arkiv.txt") {
        return {
          ...node,
          innhold: generateHintsContent(currentDay),
        };
      }

      // Day 23: Update Nice List with player names
      if (node.type === "fil" && node.navn === "snill_slem_liste.txt") {
        const completedCodes = StorageManager.getSubmittedCodes().map(
          (c) => c.kode,
        );
        const day23Completed = isDayCompleted(23, completedCodes);

        if (day23Completed) {
          // Get player names from environment variable
          const playerNames =
            process.env.NEXT_PUBLIC_PLAYER_NAMES || "Georg,Viljar,Marcus,Amund";
          const names = playerNames.split(",").map((n) => n.trim());

          // Generate updated Nice List with player names at top
          let updatedList = node.innhold || "";

          // Find the SNILL LISTE section and inject names
          const snillSection = updatedList.indexOf("✨ SNILL LISTE ✨");
          if (snillSection !== -1) {
            const listStart = updatedList.indexOf("\n\n", snillSection) + 2;
            const existingList = updatedList.substring(listStart);

            // Create new entries for players
            const playerEntries = names
              .map(
                (name, i) =>
                  `${i + 1}. ${name} - ⭐ FULLFØRT NISSEKOMM JULEKALENDER! ⭐`,
              )
              .join("\n");

            updatedList =
              updatedList.substring(0, listStart) +
              playerEntries +
              "\n" +
              existingList;

            // Update last modified date
            updatedList = updatedList.replace(
              /Sist oppdatert: .*\n/,
              `Sist oppdatert: 23. Desember ✓\n`,
            );
          }

          return {
            ...node,
            innhold: updatedList,
          };
        }
      }

      if (node.type === "mappe" && node.barn) {
        return {
          ...node,
          barn: node.barn.map(processNode),
        };
      }
      return node;
    };

    return files.map(processNode);
  }, [files, generateDiaryContent, currentDay, missions]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (nodes: FilNode[], parentPath = "root", depth = 0) => {
    return nodes.map((node) => {
      const path = `${parentPath}/${node.navn}`;
      const isExpanded = expandedFolders.has(path);

      if (node.type === "mappe") {
        return (
          <div key={path}>
            <button
              onClick={() => toggleFolder(path)}
              className="flex items-center gap-2 w-full text-left py-1 px-2 hover:bg-(--neon-green)/10 transition-colors"
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              {isExpanded ? (
                <Icons.ChevronDown size={12} />
              ) : (
                <Icons.ChevronRight size={12} />
              )}
              {isExpanded ? (
                <Icons.FolderOpen size={16} color="green" />
              ) : (
                <Icons.Folder size={16} color="green" />
              )}
              <span className="font-bold">{node.navn}</span>
            </button>
            {isExpanded && node.barn && (
              <div>{renderFileTree(node.barn, path, depth + 1)}</div>
            )}
          </div>
        );
      } else {
        return (
          <button
            key={path}
            onClick={() => setSelectedFile(node)}
            className={`
              flex items-center gap-2 w-full text-left py-1 px-2 transition-colors
              ${
                selectedFile?.navn === node.navn
                  ? "bg-(--cold-blue)/20 border-l-2 border-(--cold-blue)"
                  : "hover:bg-(--neon-green)/10"
              }
            `}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            <Icons.File size={16} color="blue" />
            <span>{node.navn}</span>
          </button>
        );
      }
    });
  };

  return (
    <RetroWindow title="NISSENET UTFORSKER" onClose={onClose}>
      <div className="p-6 flex flex-col h-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.Folder size={32} color="green" />
          <div>
            <div className="text-2xl font-bold tracking-wider">FILSYSTEM</div>
            <div className="text-sm opacity-70">UTFORSK NISSENETTVERKET</div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          {/* File tree */}
          <div className="border-2 border-(--neon-green) bg-black/50 overflow-y-auto p-2">
            <div className="text-xs font-bold mb-2 opacity-70">FILTRE</div>
            {renderFileTree(processedFiles)}
          </div>

          {/* File content viewer */}
          <div className="border-2 border-(--cold-blue) bg-black/50 overflow-y-auto p-4">
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-(--cold-blue)">
                  <Icons.File size={20} color="blue" />
                  <span className="font-bold text-(--cold-blue)">
                    {selectedFile.navn}
                  </span>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedFile.innhold || "Ingen innhold tilgjengelig"}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm opacity-50">
                <div className="text-center">
                  <Icons.Help size={32} className="mx-auto mb-2 opacity-30" />
                  <div>Velg en fil for å se innhold</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help text */}
        <div className="text-xs opacity-70 p-3 border-2 border-(--neon-green)/30">
          <div className="flex items-center gap-2">
            <Icons.Help size={12} />
            <span>Tips: Noen filer kan inneholde hint til dagens oppdrag!</span>
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}
