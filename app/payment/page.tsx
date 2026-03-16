"use client"

export default function Page() {

  const handlePayment = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: "test@email.com",
          amount: 10
        })
      })

      const data = await res.json()

      console.log(data)

      if (data.status) {
        window.location.href = data.data.authorization_url
      } else {
        alert("Payment initialization failed")
      }

    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="p-10">

      <button
        onClick={handlePayment}
        className="bg-green-600 text-white px-6 py-3 rounded"
      >
        Pay Subscription
      </button>

    </div>
  )
}