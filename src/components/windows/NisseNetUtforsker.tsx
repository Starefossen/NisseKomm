"use client";

import { Iskrystall } from "@/components/ui/Iskrystall";
import { useState, useMemo, useEffect } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { FilNode, Oppdrag } from "@/types/innhold";
import type { NisseNetTidbit } from "@/types/tidbits";
import { TIDBITS, passwordOk, rotate, visible } from "@/lib/tidbits";
import { FROST_OPEN_FOLDER } from "@/lib/frost";
import { GameEngine } from "@/lib/game-engine";
import { RuneText } from "../ui/Frostrune";
import { resolveTemplate } from "@/lib/template-resolver";

// Lines starting with this marker in a file are drawn as runes, never as text.
const RUNE_LINE = "ᚱ:";

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
  // MORO folder (tidbits.json): outside the file and hemmeligheter counters
  const moroFiles = visible(TIDBITS.nissenet.filer, currentDay).filter(
    (f) => !f.fjaer || GameEngine.getUglefjaer() >= f.fjaer,
  );
  const [moro, setMoro] = useState<NisseNetTidbit | null>(null);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [password, setPassword] = useState("");
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongLine, setWrongLine] = useState<string | null>(null);
  const openMoro = (f: NisseNetTidbit) => {
    setSelectedFile(null);
    setMoro(f);
    if (f.fjaer) GameEngine.markIntroSeen("ny-nissenet-fjaer");
    setPassword("");
    setWrongLine(null);
  };
  const tryPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moro?.passord) return;
    if (passwordOk(moro.passord, password)) {
      setOpened(new Set(opened).add(moro.navn));
      setWrongLine(null);
    } else {
      setWrongLine(
        rotate(TIDBITS.nissenet.feilPassord, wrongCount, currentDay) ??
          "FEIL PASSORD",
      );
      setWrongCount((n) => n + 1);
    }
    setPassword("");
  };
  const [initialLastVisit] = useState(() => GameEngine.getNisseNetLastVisit());

  // Track visit time when component mounts
  useEffect(() => {
    GameEngine.updateNisseNetLastVisit(currentDay);
  }, [currentDay]);

  // Check if file was newly unlocked since last visit
  const isFileNew = (fileName: string): boolean => {
    const completedQuests = GameEngine.loadGameState().completedQuests;

    // Check if any quest completed since last visit unlocked this file
    for (const quest of missions) {
      if (
        completedQuests.has(quest.dag) &&
        quest.dag > initialLastVisit &&
        quest.reveals?.files?.includes(fileName)
      ) {
        return true;
      }
    }
    return false;
  };

  // Process files and inject dynamic content for snill-listen.txt
  // Note: nissens_dagbok.txt is now handled by standalone DAGBOK module
  const processedFiles = useMemo(() => {
    const processNode = (node: FilNode): FilNode => {
      // Dagbok is now handled by standalone DAGBOK module - hide from NisseNet
      if (node.type === "fil" && node.navn === "nissens_dagbok.txt") {
        return {
          ...node,
          innhold:
            "DENNE FILEN ER FLYTTET\n\nJulius' dagbok er nå tilgjengelig som egen modul på skrivebordet.\nÅpne DAGBOK-ikonet for å lese innleggene!\n\n- NisseNet Administrator",
        };
      }

      // Day 23: Update Nice List with player names
      if (node.type === "fil" && node.navn === "snill-listen.txt") {
        const gameState = GameEngine.loadGameState();
        const completedDays = Array.from(gameState.completedQuests);
        const playerNames = GameEngine.getPlayerNames();

        // Use template resolver to handle all placeholders
        const resolvedContent = resolveTemplate(node.innhold || "", {
          playerNames,
          completedDays,
          currentDay,
        });

        return {
          ...node,
          innhold: resolvedContent,
        };
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
  }, [files, currentDay]);

  // Filter files based on unlock status and calculate stats
  const { filteredFiles, fileStats } = useMemo(() => {
    let totalFiles = 0;
    let accessibleFiles = 0;
    let secretFiles = 0;
    let accessibleSecrets = 0;

    const filterNode = (node: FilNode): FilNode | null => {
      if (node.type === "fil") {
        totalFiles++;
        const isSecret =
          node.navn.includes("hemmel") || node.navn.includes("dagbok");
        if (isSecret) secretFiles++;

        // Check if file is unlocked
        const isUnlocked = GameEngine.isFileUnlocked(node.navn, currentDay);
        if (isUnlocked) {
          accessibleFiles++;
          if (isSecret) accessibleSecrets++;
          return node;
        }
        return null; // File is locked, don't show it
      }

      if (node.type === "mappe" && node.barn) {
        const filteredChildren = node.barn
          .map(filterNode)
          .filter((child): child is FilNode => child !== null);

        // Only show folder if it has accessible children
        if (filteredChildren.length > 0) {
          return {
            ...node,
            barn: filteredChildren,
          };
        }
      }

      return null;
    };

    const filtered = processedFiles
      .map(filterNode)
      .filter((node): node is FilNode => node !== null);

    return {
      filteredFiles: filtered,
      fileStats: {
        totalFiles,
        accessibleFiles,
        secretFiles,
        accessibleSecrets,
      },
    };
  }, [processedFiles, currentDay]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  // Day 21 (frost level 2): only DEKRYPTERT is readable, the rest is under rime
  const frozen = GameEngine.getFrostMode().level === 2;

  const renderFileTree = (nodes: FilNode[], parentPath = "root", depth = 0) => {
    return nodes.map((node) => {
      const path = `${parentPath}/${node.navn}`;
      const isExpanded = expandedFolders.has(path);

      if (frozen && depth === 0 && node.navn !== FROST_OPEN_FOLDER) {
        return (
          <div
            key={path}
            className="py-1 px-2 text-(--cold-blue)/50"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            <Iskrystall size={14} /> {node.navn} (FROSSET)
          </div>
        );
      }

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
        const isNew = isFileNew(node.navn);
        const isUnreadNiceList =
          node.navn === "snill-listen.txt" && GameEngine.hasUnreadNiceList();

        return (
          <button
            key={path}
            onClick={() => {
              setMoro(null);
              setSelectedFile(node);
              // Mark Nice List as viewed when opened
              if (node.navn === "snill-listen.txt") {
                GameEngine.setNiceListViewed();
              }
            }}
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
            <span className={isNew ? "text-(--gold) font-bold" : ""}>
              {isUnreadNiceList && "● "}
              {node.navn}
              {isNew && " (NY!)"}
            </span>
          </button>
        );
      }
    });
  };

  return (
    <RetroWindow
      title={`NISSENET (${fileStats.accessibleFiles}/${fileStats.totalFiles} filer | ${fileStats.accessibleSecrets}/${fileStats.secretFiles} hemmeligheter)`}
      onClose={onClose}
    >
      <div className="p-6 flex flex-col h-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-(--neon-green)/30">
          <Icons.Folder size={32} color="green" />
          <div className="flex-1">
            <div className="text-2xl font-bold tracking-wider">FILSYSTEM</div>
            <div className="text-base opacity-70">UTFORSK NISSENETTVERKET</div>
          </div>
          <div className="text-right text-base">
            <div className="text-(--neon-green)">
              {fileStats.accessibleFiles} / {fileStats.totalFiles} FILER
            </div>
            <div className="text-(--gold)">
              {fileStats.accessibleSecrets} / {fileStats.secretFiles}{" "}
              HEMMELIGHETER
            </div>
          </div>
        </div>

        {/* Two-column layout - stacks on mobile, side-by-side on desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* File tree */}
          <div className="border-2 border-(--neon-green) bg-black/50 overflow-y-auto p-2 max-h-[40vh] lg:max-h-full">
            <div className="text-base font-bold mb-2 opacity-70">FILTRE</div>
            {renderFileTree(filteredFiles)}
            {!frozen && moroFiles.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-2 py-1 px-2 font-bold">
                  <Icons.FolderOpen size={16} color="gold" />
                  MORO
                </div>
                {moroFiles.map((f) => (
                  <button
                    key={f.navn}
                    onClick={() => openMoro(f)}
                    className={`flex items-center gap-2 w-full min-h-11 text-left px-2 pl-6 ${
                      moro?.navn === f.navn
                        ? "bg-(--gold)/20 border-l-2 border-(--gold)"
                        : "hover:bg-(--neon-green)/10"
                    }`}
                  >
                    {f.passord && !opened.has(f.navn) ? (
                      <Icons.Lock size={16} color="gold" />
                    ) : (
                      <Icons.File size={16} color="gold" />
                    )}
                    {f.navn}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* File content viewer */}
          <div className="border-2 border-(--cold-blue) bg-black/50 overflow-y-auto p-4 flex-1">
            {moro ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-(--gold)">
                  <Icons.File size={20} color="gold" />
                  <span className="font-bold text-(--gold)">{moro.navn}</span>
                </div>
                {moro.passord && !opened.has(moro.navn) ? (
                  <form onSubmit={tryPassword} className="space-y-3">
                    <label className="block text-base">
                      FILEN ER LÅST. SKRIV PASSORD:
                      <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-2 w-full min-h-11 px-3 bg-black border-2 border-(--gold) text-(--gold) text-lg uppercase focus:outline-none"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={!password.trim()}
                      className="w-full min-h-11 border-2 border-(--gold) text-(--gold) text-lg hover:bg-(--gold) hover:text-black disabled:opacity-50"
                    >
                      ÅPNE
                    </button>
                    <div
                      role="status"
                      aria-live="polite"
                      className="text-base text-(--christmas-red) min-h-6"
                    >
                      {wrongLine}
                    </div>
                  </form>
                ) : (
                  <div
                    aria-live="polite"
                    className="text-base leading-relaxed whitespace-pre-wrap"
                  >
                    {moro.tekst}
                  </div>
                )}
              </div>
            ) : selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-(--cold-blue)">
                  <div className="flex items-center gap-2">
                    <Icons.File size={20} color="blue" />
                    <span className="font-bold text-(--cold-blue)">
                      {selectedFile.navn}
                    </span>
                  </div>
                  <span className="text-base tracking-widest px-1.5 py-0.5 border border-(--cold-blue)/40 text-(--cold-blue)/80">
                    NISSENET // DOKUMENT-VISER
                  </span>
                </div>

                <div className="text-base leading-relaxed whitespace-pre-wrap">
                  {selectedFile.innhold
                    ? selectedFile.innhold
                        .split("\n")
                        .map((line, i) =>
                          line.startsWith(RUNE_LINE) ? (
                            <RuneText
                              key={i}
                              text={line.slice(RUNE_LINE.length)}
                              learned={GameEngine.getLearnedRunes()}
                            />
                          ) : (
                            <div key={i}>{line || "\u00a0"}</div>
                          ),
                        )
                    : "Ingen innhold tilgjengelig"}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-base opacity-50">
                <div className="text-center">
                  <Icons.Help size={32} className="mx-auto mb-2 opacity-30" />
                  <div>Velg en fil for å se innhold</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help text */}
        <div className="text-base opacity-70 p-3 border-2 border-(--neon-green)/30">
          <div className="flex items-center gap-2">
            <Icons.Help size={12} />
            <span>
              Tips: Filer låses opp etter hvert som du fullfører oppdrag! Nye
              filer merkes med (NY!)
            </span>
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}
