class M{constructor(t){this.songData=t,this.divisions=4,this.lastHarmonyXml="",this.lastNotes=[]}generate(){const{header:t,body:s,structure:d}=this.songData,c=t.center.top.name||"Sin título",e=t.center.bottom.author||"",m=t.left.bottom.signature||"4/4",a=t.left.top.tempo||"120",[h,i]=m.split("/").map(Number),b=[],$={};s.forEach(o=>{$[o.id]=o}),d.forEach((o,l)=>{if(o.id&&!o.isBreak&&$[o.id]){const f=$[o.id],u=`${o.id}${l+1}`;f.compass.forEach((p,r)=>{b.push({...p,sectionId:f.id,rehearsalMark:r===0?u:null})})}});let n=`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work>
    <work-title>${this.escapeXml(c)}</work-title>
  </work>
  <identification>
    <creator type="composer">${this.escapeXml(e)}</creator>
    <encoding>
      <software>Vue Group Sheet</software>
      <encoding-date>${new Date().toISOString().split("T")[0]}</encoding-date>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Guitar</part-name>
    </score-part>
  </part-list>
  <part id="P1">`;return b.forEach((o,l)=>{n+=`
    <measure number="${l+1}">`,o.rehearsalMark&&(n+=`
      <direction placement="above">
        <direction-type>
          <rehearsal font-weight="bold">${this.escapeXml(o.rehearsalMark)}</rehearsal>
        </direction-type>
      </direction>`),l===0&&(n+=`
      <attributes>
        <divisions>${this.divisions}</divisions>
        <key>
          <fifths>${this.toneToFifths(t.right.top.tone)}</fifths>
        </key>
        <time>
          <beats>${h||4}</beats>
          <beat-type>${i||4}</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome>
            <beat-unit>quarter</beat-unit>
            <per-minute>${a}</per-minute>
          </metronome>
        </direction-type>
        <sound tempo="${a}"/>
      </direction>`),(h||4)*this.divisions,(o.chords||[]).forEach((u,p)=>{let r=4;switch(u.div){case 1:r=(h||4)*this.divisions;break;case 5:r=3*this.divisions;break;case 2:r=2*this.divisions;break;case 3:case 4:r=1*this.divisions;break}const y=this.durationToType(r),g=u.chord||"";if(g==="REST")n+=`
      <note>
        <rest/>
        <duration>${r}</duration>
        <type>${y}</type>
      </note>`;else if(g==="R"||g==="%")this.lastHarmonyXml?(n+=this.lastHarmonyXml,n+=this.generateNoteStack(this.lastNotes,r,y)):n+=`
      <note>
        <rest/>
        <duration>${r}</duration>
        <type>${y}</type>
      </note>`;else if(g!=="S"){const v=this.generateHarmony(g);this.lastHarmonyXml=v,this.lastNotes=this.interpretChord(g),n+=v,n+=this.generateNoteStack(this.lastNotes,r,y)}}),n+=`
    </measure>`}),n+=`
  </part>
</score-partwise>`,n}generateNoteStack(t,s,d){if(!t||t.length===0)return"";let c="";return t.forEach((e,m)=>{c+=`
      <note>
        ${m>0?"<chord/>":""}
        <pitch>
          <step>${e.step}</step>
          ${e.alter!==0?`<alter>${e.alter}</alter>`:""}
          <octave>${e.octave}</octave>
        </pitch>
        <duration>${s}</duration>
        <type>${d}</type>
      </note>`}),c}interpretChord(t){const s=t.match(/^([A-G])([#b])?(.*?)(?:[/\\]([A-G][#b]?))?$/);if(!s)return[];const d=s[1],c=s[2]||"",e=s[3]||"",m=s[4]||null,a={C:0,D:2,E:4,F:5,G:7,A:9,B:11};let h=a[d];c==="#"&&(h+=1),c==="b"&&(h-=1);let i=[0,4,7];const b=e.includes("m")&&!e.includes("maj")||e.includes("-"),$=e.includes("maj")||e.includes("M"),n=e.includes("m7b5")||e.includes("-7b5")||e.includes("ø"),o=e.includes("dim")||e.includes("o")&&!n,l=e.includes("aug")||e.includes("+");n?i=[0,3,6,10]:b?(i=[0,3,7],e.includes("7")&&i.push(10)):$&&e.includes("7")?i=[0,4,7,11]:e.includes("7")?i=[0,4,7,10]:o?(i=[0,3,6],e.includes("7")&&i.push(9)):l?i=[0,4,8]:e.includes("sus4")?i=[0,5,7]:e.includes("sus2")&&(i=[0,2,7]),e.includes("9")&&i.push(14),e.includes("11")&&i.push(17),e.includes("13")&&i.push(21);let f=null;if(m){const p=m.match(/^([A-G])([#b])?$/);if(p){let r=a[p[1]];p[2]==="#"&&(r+=1),p[2]==="b"&&(r-=1),f=r+36}}const u=i.map(p=>{const r=h+p+48;return this.semitoneToPitch(r)});return f!==null&&u.unshift(this.semitoneToPitch(f)),u}semitoneToPitch(t){const s=["C","C","D","D","E","F","F","G","G","A","A","B"],d=[0,1,0,1,0,0,1,0,1,0,1,0],c=Math.floor(t/12),e=t%12;return{step:s[e],alter:d[e],octave:c}}generateHarmony(t){const s=t.match(/^([A-G])([#b])?(.*?)(?:[/\\]([A-G][#b]?))?$/);if(!s)return"";const d=s[1],c=s[2]==="#"?1:s[2]==="b"?-1:0,e=s[3]||"",m=s[4]||null;let a="major";const h=e.includes("m")&&!e.includes("maj")||e.includes("-"),i=e.includes("maj")||e.includes("M"),b=e.includes("m7b5")||e.includes("-7b5")||e.includes("ø"),$=e.includes("dim")||e.includes("o")&&!b,n=e.includes("aug")||e.includes("+");b?a="half-diminished":h?a=e.includes("7")?"minor-seventh":"minor":i&&e.includes("7")?a="major-seventh":e.includes("7")?a="dominant":$?a=e.includes("7")?"diminished-seventh":"diminished":n?a="augmented":e.includes("sus4")?a="suspended-fourth":e.includes("sus2")&&(a="suspended-second");let o="";if(m){const l=m.match(/^([A-G])([#b])?$/);if(l){const f=l[1],u=l[2]==="#"?1:l[2]==="b"?-1:0;o=`
        <bass>
          <bass-step>${f}</bass-step>
          ${u!==0?`<bass-alter>${u}</bass-alter>`:""}
        </bass>`}}return`
      <harmony>
        <root>
          <root-step>${d}</root-step>
          ${c!==0?`<root-alter>${c}</root-alter>`:""}
        </root>
        <kind>${a}</kind>${o}
        <offset>0</offset>
      </harmony>`}toneToFifths(t){return{C:0,G:1,D:2,A:3,E:4,B:5,"F#":6,"C#":7,F:-1,Bb:-2,Eb:-3,Ab:-4,Db:-5,Gb:-6,Cb:-7,Am:0,Em:1,Bm:2,"F#m":3,"C#m":4,"G#m":5,"D#m":6,Dm:-1,Gm:-2,Cm:-3,Fm:-4,Bbm:-5,Ebm:-6}[t]||0}durationToType(t){return t>=16?"whole":t>=8?"half":t>=4?"quarter":t>=2?"eighth":"16th"}escapeXml(t){return t?t.replace(/[<>&'"]/g,s=>{switch(s){case"<":return"&lt;";case">":return"&gt;";case"&":return"&amp;";case"'":return"&apos;";case'"':return"&quot;";default:return s}}):""}}export{M as MusicXMLGenerator};
