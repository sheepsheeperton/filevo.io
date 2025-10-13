import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/Stat";

const Swatch = ({ name, varName }: { name: string; varName: string }) => (
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-lg border border-border" style={{ backgroundColor: `hsl(var(${varName}))` }} />
    <div className="text-sm"><span className="text-fg-muted">{name}</span> <code className="ml-2 text-xs text-fg-subtle">{varName}</code></div>
  </div>
);

export default function Sandbox() {
  return (
    <AppShell>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-semibold">UI Sandbox</h1>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Stat label="Time Saved" value="12 hrs" hint="Past 7 days" />
          <Stat label="Projects Completed" value="24" />
          <Stat label="In-progress" value="7" />
        </section>

        <section>
          <h2 className="text-lg font-medium mb-3">Buttons</h2>
          <div className="flex gap-3">
            <Button>Primary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-3">Cards</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Hours Spent</CardTitle></CardHeader>
              <CardContent>
                <div className="h-36 rounded-lg border border-border p-3">
                  {/* Faux chart bars */}
                  <div className="grid grid-cols-7 gap-2 h-full items-end">
                    {[20,38,25,60,48,70,62].map((h,i)=>(
                      <div key={i} className="rounded-t-md bg-gradient-to-t from-chart2 to-chart1" style={{height: `${h}%`}} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Incomplete Tasks</CardTitle></CardHeader>
              <CardContent>
                <div className="h-36 flex items-center justify-center">
                  <div className="relative h-28 w-28 rounded-full border-[10px]" style={{borderColor: "hsl(var(--chart-5))"}}>
                    <div className="absolute inset-0 rounded-full border-[10px]" style={{borderColor: "hsl(var(--chart-1))", clipPath: "inset(0 40% 0 0)"}}/>
                    <div className="absolute inset-0 grid place-items-center text-center">
                      <div>
                        <div className="text-xl font-semibold">14</div>
                        <div className="text-xs text-fg-muted">of 20</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-3">Colors</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Swatch name="Background" varName="--bg" />
            <Swatch name="Surface" varName="--surface" />
            <Swatch name="Elev" varName="--elev" />
            <Swatch name="Border" varName="--border" />
            <Swatch name="Text" varName="--fg" />
            <Swatch name="Muted" varName="--fg-muted" />
            <Swatch name="Subtle" varName="--fg-subtle" />
            <Swatch name="Brand" varName="--brand" />
            <Swatch name="Success" varName="--success" />
            <Swatch name="Warning" varName="--warning" />
            <Swatch name="Danger" varName="--danger" />
            <Swatch name="Info" varName="--info" />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-3">Typography</h2>
          <div className="space-y-1">
            <div className="text-3xl font-semibold">Heading 1</div>
            <div className="text-2xl font-semibold">Heading 2</div>
            <div className="text-xl font-semibold">Heading 3</div>
            <div className="text-base">Body text — Inter</div>
            <div className="text-sm text-fg-muted">Muted body</div>
            <div className="font-mono">Mono numbers — 24.9 hrs</div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

