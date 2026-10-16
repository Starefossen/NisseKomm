"use client";

import { useState, useMemo, useEffect } from "react";
import { RetroWindow } from "../ui/RetroWindow";
import { Icons } from "@/lib/icons";
import { FilNode, Oppdrag } from "@/types/innhold";
import { GameEngine } from "@/lib/game-engine";
import { resolveTemplate } from "@/lib/template-resolver";

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
  const [friendNames, setFriendNames] = useState<string[]>([]);
  const [initialLastVisit] = useState(() => GameEngine.getNisseNetLastVisit());

  // Fetch friend names from Sanity session on mount
  useEffect(() => {
    async function loadFriendNames() {
      try {
        const names = await GameEngine.getFriendNames();
        setFriendNames(names);
      } catch (error) {
        console.error("Failed to load friend names:", error);
      }
    }
    loadFriendNames();
  }, []);

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

  // Process files and inject dynamic content for snill_slem_liste.txt
  // Note: nissens_dagbok.txt is now handled by standalone DAGBOK module
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
        if (mission && mission.fysisk_hint) {
          content += `Dag ${day}: ${mission.fysisk_hint}\n`;
        }
      }

      if (maxDay < 24) {
        content +=
          "\n[Flere hint låses opp etter hvert som dere fullfører flere dager]";
      }

      return content;
    };

    const processNode = (node: FilNode): FilNode => {
      // Dagbok is now handled by standalone DAGBOK module - hide from NisseNet
      if (node.type === "fil" && node.navn === "nissens_dagbok.txt") {
        return {
          ...node,
          innhold:
            "DENNE FILEN ER FLYTTET\n\nJulius' dagbok er nå tilgjengelig som egen modul på skrivebordet.\nÅpne DAGBOK-ikonet for å lese innleggene!\n\n- NisseNet Administrator",
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
        const gameState = GameEngine.loadGameState();
        const completedDays = Array.from(gameState.completedQuests);
        const playerNames = GameEngine.getPlayerNames();

        // Use template resolver to handle all placeholders
        const resolvedContent = resolveTemplate(node.innhold || "", {
          playerNames,
          friendNames,
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
  }, [files, currentDay, missions, friendNames]);

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
        const isNew = isFileNew(node.navn);
        const isUnreadNiceList =
          node.navn === "snill_slem_liste.txt" &&
          GameEngine.hasUnreadNiceList();

        return (
          <button
            key={path}
            onClick={() => {
              setSelectedFile(node);
              // Mark Nice List as viewed when opened
              if (node.navn === "snill_slem_liste.txt") {
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
              {isUnreadNiceList && "🔴 "}
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
            <div className="text-sm opacity-70">UTFORSK NISSENETTVERKET</div>
          </div>
          <div className="text-right text-sm">
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
            <div className="text-xs font-bold mb-2 opacity-70">FILTRE</div>
            {renderFileTree(filteredFiles)}
          </div>

          {/* File content viewer */}
          <div className="border-2 border-(--cold-blue) bg-black/50 overflow-y-auto p-4 flex-1">
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-(--cold-blue)">
                  <div className="flex items-center gap-2">
                    <Icons.File size={20} color="blue" />
                    <span className="font-bold text-(--cold-blue)">
                      {selectedFile.navn}
                    </span>
                  </div>
                  <span className="text-[10px] tracking-widest px-1.5 py-0.5 border border-(--cold-blue)/40 text-(--cold-blue)/80">
                    NISSENET // DOKUMENT-VISER
                  </span>
                </div>

                {/* CRT Visual Evidence & Telemetry Schematic Header */}
                {(() => {
                  const name = selectedFile.navn;
                  const isKulde =
                    name.includes("snofall_fakta") ||
                    name.includes("frosne-koder") ||
                    name.includes("nordpolen_hemmelighet") ||
                    name.includes("system_logg");
                  const isVerksted =
                    name.includes("magisk-sekk") ||
                    name.includes("halvveis") ||
                    name.includes("verksted") ||
                    name.includes("kode_oversikt");
                  const isAntenne =
                    name.includes("tidsanomalier") ||
                    name.includes("antenna-crisis") ||
                    name.includes("dekoder_reinsdyr") ||
                    name.includes("stjernetegn");
                  const isPrism = name.includes("snowflake");
                  const isColor = name.includes("farge");

                  const feedSrc = isKulde
                    ? "/feed/kulde-grotte.png"
                    : isVerksted
                      ? "/feed/iq-verksted.png"
                      : isAntenne
                        ? "/feed/antenne-tarn.png"
                        : isPrism
                          ? "/feed/snøfall-storm.png"
                          : isColor
                            ? "/feed/snøfall-day.png"
                            : "/feed/julius-kontor.png";

                  const badgeText = isKulde
                    ? "BEVIS // 85.0 MHz SPORINGSFIL"
                    : isVerksted
                      ? "SKJEMA // IQS VERKSTED-TELEMETRI"
                      : isAntenne
                        ? "RADAR // ANTENNETÅRNET NORD"
                        : isPrism
                          ? "PRISME // KRYSTALL-ANALYSE"
                          : isColor
                            ? "SPEKTER // OPTISK KALIBRERING"
                            : "ARKIV // JULIUS' KONTOR";

                  const accentColor = isKulde
                    ? "var(--christmas-red)"
                    : isVerksted || isColor
                      ? "var(--neon-green)"
                      : isAntenne || isPrism
                        ? "var(--cold-blue)"
                        : "var(--gold)";

                  return (
                    <div
                      className="relative h-28 w-full overflow-hidden border-2 bg-black"
                      style={{ borderColor: accentColor }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={feedSrc}
                        alt={selectedFile.navn}
                        className="w-full h-full object-cover contrast-125 saturate-90 opacity-75 select-none pointer-events-none"
                        style={{ objectPosition: "center 45%" }}
                      />
                      {/* Technical SVG Overlay */}
                      <svg
                        viewBox="0 0 400 110"
                        className="absolute inset-0 w-full h-full pointer-events-none opacity-75"
                        preserveAspectRatio="none"
                      >
                        <line
                          x1="0"
                          y1="55"
                          x2="400"
                          y2="55"
                          stroke={accentColor}
                          strokeWidth="0.6"
                          strokeDasharray="4 4"
                          opacity="0.5"
                        />
                        {isKulde ? (
                          <polyline
                            fill="none"
                            stroke="#ff0037"
                            strokeWidth="1.8"
                            points="0,55 40,55 55,20 70,90 85,30 100,80 120,55 180,55 195,15 210,95 225,25 240,85 260,55 400,55"
                          />
                        ) : isVerksted ? (
                          <g
                            stroke="#00ff00"
                            strokeWidth="1.2"
                            fill="none"
                            opacity="0.7"
                          >
                            <rect x="280" y="25" width="95" height="60" />
                            <line x1="250" y1="40" x2="280" y2="40" />
                            <line x1="250" y1="70" x2="280" y2="70" />
                            <circle cx="310" cy="55" r="12" />
                            <line x1="322" y1="55" x2="360" y2="55" />
                          </g>
                        ) : (
                          <polyline
                            fill="none"
                            stroke={accentColor}
                            strokeWidth="1.4"
                            points="0,75 60,65 120,70 180,45 240,55 300,35 360,42 400,30"
                          />
                        )}
                      </svg>
                      <div
                        className="absolute inset-0 pointer-events-none opacity-45"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 1px, transparent 1px, transparent 3px)",
                        }}
                      />
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.88) 100%)",
                        }}
                      />
                      <div className="absolute top-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold tracking-widest">
                        <span
                          className="bg-black/80 px-2 py-0.5 border"
                          style={{
                            borderColor: accentColor,
                            color: accentColor,
                          }}
                        >
                          {badgeText}
                        </span>
                        <span className="bg-black/80 px-2 py-0.5 text-(--cold-blue) border border-(--cold-blue)/40">
                          CRC: VERIFISERT
                        </span>
                      </div>
                    </div>
                  );
                })()}

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
