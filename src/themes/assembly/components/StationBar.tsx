/** The machine header that opens every section: station id, name and a live state. */
export default function StationBar({ code, name, state, extra }: { code: string; name: string; state: string; extra?: string }) {
  return (
    <div className="stn__bar mono">
      <span>
        STN-{code} / {name}
      </span>
      {extra && <span className="stn__extra">{extra}</span>}
      <span className="stn__state">
        <i aria-hidden="true" /> {state}
      </span>
    </div>
  )
}
