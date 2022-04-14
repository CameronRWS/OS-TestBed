import "./AdminDashboard.css";
import Chartist from "react-chartist";
import { Chart as ChartJS,
   CategoryScale, 
   LinearScale, 
   BarElement, 
   Title, 
   Tooltip, 
   Legend
} from "chart.js";
import {Bar} from "react-chartjs-2";
import { useState, useEffect } from "react";
import Button from "react-bootstrap/esm/Button";

ChartJS.register(
  CategoryScale, 
   LinearScale, 
   BarElement, 
   Title, 
   Tooltip, 
   Legend
);

function AdminDashboard({ setPage, setID, userId }) {
  const [graph, setGraph] = useState(false);
  const [gdata, setGData] = useState(null);
  const [list, setList] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [chartData,setChartData] = useState({
    datasets: [],
  });
  const [chartOptions,setChartOptions] = useState({});
  //var occurrences = [];
  //let chartA = {};

  // function getEvents() {
  //   fetch(`http://${process.env.REACT_APP_IP}:8080/api/userActivity`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //   }).then(async (response) => {
  //     if (response.status === 200) {
  //       let json = await response.json();
  //       let seriesVals = [];
  //       for (var i = 1; i < json.length; i++) {
  //         seriesVals.push(new Date(json[i].createdAt).getHours());
  //       }
  //       occurrences = seriesVals.reduce(function (obj, item) {
  //         obj[item] = (obj[item] || 0) + 1;
  //         return obj;
  //       }, {});
  //       chartA = {
  //         labels: [
  //           1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
  //           20, 21, 22, 23, 24,
  //         ],
  //         series: [occurrences],
  //       };
  //       return chartA;
  //     }
  //   });
  // }

  let chartB = {
    labels: ["y", "z"],
    series: [
      [{ meta: "value is:", value: 2 }, { meta: "value is:", value: 4 }],
      [{ meta: "value is:", value: 6 }, { meta: "value is:", value: 8 }]
    ]
  };
  const options = {
    high: 10,
    low: -10,
    axisX: {
      labelInterpolationFnc(value, index) {
        return index % 2 === 0 ? value : null;
      }
    }
  };

  useEffect(() => {
    setChartData({
      labels:["HI","Bye"],
      datasets: [
        {
          labels:"Dog",
          data: [25,125],
          borderColor: "rgb(53,162,235)",
          backgroundColor: "rgba(53,162,235,0.4)",
        },
      ],
    });
    setChartOptions({
      responsive: true,
      plugins: {
        legend: {
          position: "top"
        },
        title: {
          display: true,
          text: "Title",
        },
      },
    });
  },[])

  function onBtnClick(id, available) {
    if (available) {
      setID(id);
      let comp = {userId: userId, computerId: id};
      fetch(`http://${process.env.REACT_APP_IP}:8080/api/useComputer`,
        { 
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(comp)
        }
      ).then(async (response) => {
        let json = await response.json();
        if (response.status === 200) {
          setPage("TerminalPage");
        } else {
          document.getElementById("fail_message").innerHTML = "<p><small>"+json.message+"</small></p>";
        }
      });
    }
  }

  const getData = async () => {
    setLoaded(false);
    const res = await fetch(`http://${process.env.REACT_APP_IP}:8080/api/userActivity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    setGData(await res.json());
  };

  useEffect(() => {
    getData();
  }, []);

  const loadData = async () => {
    setLoaded(false);
    const res = await fetch(
      `http://${process.env.REACT_APP_IP}:8080/api/computer`
    );
    setList(await res.json());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 100000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if(list!=null)
      setLoaded(true);
  }, [list]);

  let content = (
    <nav>
      <div className="Header">Welcome</div>
      <br/>
      <button onClick={() => setPage("ChangePasswordForm")}>
        Go to Change Password
      </button>
      <div id="fail_message"></div>
      {loaded ? (
        <ul>
          {list.map((item) => (
            <li key={item.computerId}>
              <button onClick={() => onBtnClick(item.computerId, !item.inUse)}>
                Pi Number: {item.computerId} Pi Type: {item.model}
              </button>
              <div>Pi availability: {String(!item.inUse)}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading...</p>
      )}
      <br></br>
      <div className="AdminDashboard">
        {!graph && <Button onClick={() => setGraph(true)}>Use Graph</Button>}
        {graph && <Bar data={chartData} options={chartOptions} />}
      </div>
    </nav>
  );
  return content;
}

export default AdminDashboard;
