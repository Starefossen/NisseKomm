const ren = (s: string) => s.replace(/[*`]/g, "");

/** Just enough markdown for the docs: headings, lists, tables, paragraphs. */
export function Markdown({ tekst }: { tekst: string }) {
  return tekst
    .trim()
    .split(/\n\s*\n/)
    .map((b, i) => {
      const linjer = b.split("\n");
      if (b.startsWith("#"))
        return (
          <h3 key={i} className="text-xl text-(--gold) mt-4">
            {ren(b.replace(/^#+\s*/, ""))}
          </h3>
        );
      if (b.startsWith("|")) {
        const rader = linjer
          .filter((l) => !/^\|\s*-/.test(l))
          .map((l) => l.slice(1, l.lastIndexOf("|")).split("|"));
        return (
          <div key={i} className="overflow-x-auto">
            <table className="text-base border-collapse">
              <tbody>
                {rader.map((r, j) => (
                  <tr key={j} className={j === 0 ? "text-(--gold)" : ""}>
                    {r.map((c, k) => (
                      <td
                        key={k}
                        className="border border-(--neon-green)/40 p-1 align-top"
                      >
                        {ren(c.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      if (/^(- |\d+\. )/.test(b))
        return (
          <ul key={i} className="list-disc pl-6 space-y-1">
            {linjer.map((l, j) => (
              <li key={j}>{ren(l.replace(/^(- |\d+\. )/, ""))}</li>
            ))}
          </ul>
        );
      return <p key={i}>{ren(b)}</p>;
    });
}
