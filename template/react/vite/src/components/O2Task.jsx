import {useState, useEffect} from "react";
import {component, lp, o2} from "@o2oa/component";

function O2Task(){
    const [taskList, setTaskList] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const json = await o2.Actions.load("x_processplatform_assemble_surface").TaskAction.V2ListPaging(1, 5);
                setTaskList(json.data);
            } catch (error) {
                console.error('Error fetching task list:', error);
            }
        })();
    }, []);

    function openTask(id){
        o2.api.page.openWork(id);
    }
    function openCalendar(){
        o2.api.page.openApplication("Calendar");
    }
    function openOrganization(){
        o2.api.page.openApplication("Org");
    }
    function openInBrowser() {
        component.openInNewBrowser(true);
    }
    function startProcess(){
        o2.api.page.startProcess();
    }
    function createDocument(){
        o2.api.page.createDocument();
    }


    return (
        <div>
            <table className='taskListTable'>
                <thead>
                <tr>
                    <th>{lp.taskTitle}</th>
                    <th>{lp.taskProcess}</th>
                    <th>{lp.taskTime}</th>
                </tr>
                </thead>
                <tbody>
                {taskList.map((task) => (
                    <tr key={task.id}>
                        <td><a href="#" onClick={() => openTask(task.work)}>{task.title}</a></td>
                        <td>{task.processName}</td>
                        <td>{task.startTime}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            <div>
                <button onClick={openCalendar}>{lp.openCalendar}</button>
                <button onClick={openOrganization}>{lp.openOrganization}</button>
                <button onClick={startProcess}>{lp.startProcess}</button>
                <button onClick={createDocument}>{lp.createDocument}</button>
                <br/>
                <button onClick={openInBrowser}>{lp.openInBrowser}</button>
            </div>
        </div>
    );
}

export default O2Task
