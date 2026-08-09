fetch("http://localhost:3000/treinos", {

    method: "POST",

    headers: {
        "Content-Type": "application/json"
    },

    body: JSON.stringify({

        treino: "A",

        exercicio: "Remada aberta",

        series: [

            {
                numero: 1,
                carga: 50,
                repeticoes: 15
            },

            {
                numero: 2,
                carga: 50,
                repeticoes: 14
            },

            {
                numero: 3,
                carga: 55,
                repeticoes: 12
            },

            {
                numero: 4,
                carga: 55,
                repeticoes: 12
            }

        ]

    })

})
.then(resposta => resposta.json())
.then(resultado => {

    console.log(resultado);

})
.catch(erro => {

    console.error(erro);

});