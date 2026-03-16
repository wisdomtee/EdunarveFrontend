"use client"

import { useState } from "react"

export default function VerifyPage(){

  const [code,setCode] = useState("")
  const [result,setResult] = useState<any>(null)

  const verifyResult = async () => {

    const res = await fetch(`http://localhost:5000/api/results/verify/${code}`)

    const data = await res.json()

    setResult(data)

  }

  return(

    <div style={{padding:40}}>

      <h1>Verify Result</h1>

      <input
        placeholder="Verification Code"
        onChange={(e)=>setCode(e.target.value)}
      />

      <br/><br/>

      <button onClick={verifyResult}>
        Verify
      </button>

      {result && (

        <div>

          <h3>Student: {result.student.name}</h3>
          <h3>Score: {result.score}</h3>
          <h3>Grade: {result.grade}</h3>

        </div>

      )}

    </div>

  )
}