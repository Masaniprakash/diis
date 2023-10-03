const { INTERNAL_SERVER_ERROR, BAD_REQUEST, OK } = require("http-status");
const { ReE, ReS, isNull, isEmpty, to, todays, generateCode } =  require("../service/util.service");
const { checkOrganization, checkDiscipline, checkTimeFrameWithDisciplineProgram, checkSubjectTeachByUser, checkFacultyAvailability, getTimeTableWithFrameMultiSection, checkSpeClassAvaiForThisTimeForSec } = require("./common");
const { checkProgram } = require("./program");
const { checkDepartment } = require("./department");
const { checkCourseDepart } = require("./course_department_mapping");
const { checkCourseBatch } = require("./course_batch");
const { checkBatchSemester } = require("./batch_sem");
const { checkSubject } = require("./subject");
const { checkTopic } = require("./topic");
const { checkSubTopic } = require("./sub_topic");
const { Op } = require("sequelize");
const moment = require('moment'); 
const { leave ,section , special_class } = require('../models');
const { IsValidUUIDV4 } = require("../service/validation"); 

exports.verifySpecialClass = async (req, res) => {
    let body = req.body , err; 

    let fields = ['discipline_id', 'program_id', 'cdm_id', 'course_batch_id', 'section_id', 'name',
        'session_date'  , 'org_id' , 'faculty_id',  'subject_orientated','after_complete_all_session' ,
         'attendance_taken' , 'all_student'  ,'batch_sem_id' 
    ];// 'department_id',

    let inVaildFields = fields.filter(x => isNull(body[x]));

    if (!isEmpty(inVaildFields)) {
        return ReE(res, { message: `Please enter required fields ${inVaildFields}!.` }, BAD_REQUEST);
    } 

    if (!Array.isArray(body.section_id)) {
        return ReE(res, { message: 'section id must be a array' }, BAD_REQUEST);
    }

    let checkOrg = await checkOrganization({ org_id: body.org_id });

    if (!checkOrg.success) {
        return ReE(res, { message: checkOrg.message }, BAD_REQUEST);
    }

    let checkDisciplineDetails = await checkDiscipline({ discipline_id: body.discipline_id, org_id: checkOrg.organizationDetails._id });

    if (!checkDisciplineDetails.success) {
        return ReE(res, { message: checkDisciplineDetails.message }, BAD_REQUEST);
    }

    let checkProgramDetails = await checkProgram({ program_id: body.program_id, discipline_id: body.discipline_id });

    if (!checkProgramDetails.success) {
        return ReE(res, { message: checkProgramDetails.message }, BAD_REQUEST);
    }

    let checkDepartmentDetails = await checkDepartment({ discipline_id: body.discipline_id, department_id: body.department_id });

    if (!checkDepartmentDetails.success) {
        return ReE(res, { message: checkDepartmentDetails.message }, HttpStatus.BAD_REQUEST);
    }

    let checkCourseDepartmentDetails = await checkCourseDepart({ cdm_id: body.cdm_id, program_id: body.program_id });

    if (!checkCourseDepartmentDetails.success) {
        return ReE(res, { message: checkCourseDepartmentDetails.message }, BAD_REQUEST);
    }

    let checkCourseBatchDetails = await checkCourseBatch({ course_batch_id: body.course_batch_id, org_id: body.org_id, cdm_id: body.cdm_id, program_id: body.program_id, from: 'present' });

    if (!checkCourseBatchDetails.success) {
        return ReE(res, { message: checkCourseBatchDetails.message }, BAD_REQUEST);
    }  

    let checkBatchSemDetails = await checkBatchSemester({ batch_sem_id: body.batch_sem_id, from: 'present' });
    
    if (!checkBatchSemDetails.success) {
        return ReE(res, { message: checkBatchSemDetails.message }, BAD_REQUEST);
    }
    
    if( checkCourseBatchDetails.courseBatchData.current_sim !== checkBatchSemDetails.batchSemesters._id ){
        ReE(res, { message: "special class create only for current semester" }, BAD_REQUEST);
    }

    let leaveData  

    [err, leaveData ] = await to(leave.findOne( {
        where: {
            org_id: body.org_id,
            date: { [Op.gte]: moment().format('YYYY-MM-DD 00:00:00+00'), [Op.lt]: moment().add(1,"d").format('YYYY-MM-DD 00:00:00+00') }
        }
    }));

    if(err){
        ReE(res, err, INTERNAL_SERVER_ERROR);
    }

    if(!isNull(leaveData)){
        return ReE(res, { message: "special class can not create in leave days" }, BAD_REQUEST);
    } 

    if (isEmpty(body.section_id)) {
        return ReE(res, { message: "Please enter the section" }, BAD_REQUEST);
    }

    if(body.subject_orientated == true){

        if (isNull(body.subject_id)) {
            return ReE(res, { message: "Please enter the subject" }, BAD_REQUEST);
        } 

        body.remark = null;

        let checkSubjectDetails = await checkSubject({ subject_id: body.subject_id , department_id : body.department_id });

        if (!checkSubjectDetails.success) {
            return ReE(res, { message: checkSubjectDetails.message }, BAD_REQUEST)
        }

        if(isNull(body.topic_id)){
            return ReE(res, { message: "Please enter the topic" }, BAD_REQUEST);
        } 

        if (!IsValidUUIDV4(body.topic_id)) {
            return ReE(res, { message: 'Please select vaild topic!.' }, BAD_REQUEST)
        }

        let checkTopicDetails = await checkTopic({ topic_id: body.topic_id , subject_id : body.subject_id });

        if (!checkTopicDetails.success) {
            return ReE(res, { message: checkTopicDetails.message }, BAD_REQUEST)
        }

        if(isNull(body.sub_topic_id)){
            return ReE(res, { message: "Please enter the sub topic " }, BAD_REQUEST) 
        } 
        if (!IsValidUUIDV4(body.topic_id)) {
            return ReE(res, { message: 'Please select vaild topic!.' }, BAD_REQUEST)
        }

        let checkSubTopicDetails = await checkSubTopic({ subject_id : body.subject_id , sub_topic_id: body.sub_topic_id , topic_id : body.topic_id });

        if (!checkSubTopicDetails.success) {
            return ReE(res, { message: checkSubTopicDetails.message }, BAD_REQUEST)
        } 

    }else{

        body.subject_id = null;
        body.topic_id = null;
        body.sub_topic_id = null;

        if(isNull(body.remark)){
            return ReE(res, { message: "Please enter the remark " }, BAD_REQUEST);
        }

    }

    if(body.attendance_taken == true){ 

        if(isNull(body.attended_attendance_percentage)){
            return ReE(res, { message: "Please enter the student attended attendance percentage " }, BAD_REQUEST);
        }

        if(body.attended_attendance_percentage < 0 || body.attended_attendance_percentage >= 100){
            return ReE(res, { message: "Please enter the attended attendance percentage between 0 to 100 " }, BAD_REQUEST);
        }
        
    }else{

        body.attended_attendance_percentage = null;

    }
    
    if(body.all_student == false){

        if(isEmpty(body.student_list)){
            return ReE(res, { message: "Please select the student list" }, BAD_REQUEST);
        }

        for (let index = 0; index < body.student_list.length; index++) {
            const element = body.student_list[index];
            
        }

    }else{

        body.student_list = null;

    }
    
    let checkTimeFrameDetails;//we use checkFacultyDetails so we use outside checkTimeFrameWithDisciplineProgram 

    if(body.after_complete_all_session == false){
        
        if(isNull(body.time_frame_id)){
            ReE(res, { message: "Please enter the time frame" }, BAD_REQUEST);
        }

        checkTimeFrameDetails = await checkTimeFrameWithDisciplineProgram({ time_frame_id: body.time_frame_id , org_id : body.org_id , program_id : body.program_id , discipline_id : body.discipline_id  })

        if(!checkTimeFrameDetails.success){
            return ReE(res, { message: checkTimeFrameDetails.message }, BAD_REQUEST)
        }  

        body.session_start_time = checkTimeFrameDetails.data.session_start_time;
        body.session_end_time = checkTimeFrameDetails.data.session_end_time;
        let start_time = moment(body.session_start_time, 'hh:mm');
        let end_time = moment(body.session_end_time, 'hh:mm');
        body.duration = moment.duration(moment(end_time._d).diff(start_time._d)).asMinutes();

        //we get session already in this time frame for selected section and date ,  
        let checkSessionAlreadyInThisTimeFrame = await getTimeTableWithFrameMultiSection({org_id : body.org_id , time_frame_id : body.time_frame_id , session_date : body.session_date , 
            section_id : body.section_id , discipline_id : body.discipline_id , program_id : body.program_id , cdm_id : body.cdm_id , course_batch_id : body.course_batch_id , batch_sem_id : body.batch_sem_id
        }) 

        // let sectionName = []  

        // if(checkSessionAlreadyInThisTimeFrame.confirm){
        //      console.log("session is not found so we create the special class for given section and time frame")
        // }else if(!checkSessionAlreadyInThisTimeFrame.confirm){
    
        //     for (let index = 0; index < checkSessionAlreadyInThisTimeFrame.data.length; index++) {
        //         const element = checkSessionAlreadyInThisTimeFrame.data[index]; 
        //         console.log("element",element);
        //         sectionName.push(element.sectionId.name)
        //     }

        //     return ReE(res, { message: `session already exits for this time frame for  section ${sectionName} `  }, BAD_REQUEST);

        // }
        
        //this time special class create for selected section
        let checkSepicalClassAvailForSec ;

        
        if(isNull(body.session_date)){
            return ReE(res, { message: "Please enter the session date for checking special class" }, BAD_REQUEST);
        }
        
        //we check already special class is the for this time frame for selected section so we pass time frame id 
        checkSepicalClassAvailForSec  = await checkSpeClassAvaiForThisTimeForSec({session_date : body.session_date, time_frame_id  : body.time_frame_id , org_id : body.org_id , 
            discipline_id : body.discipline_id , program_id : body.program_id , cdm_id : body.cdm_id , course_batch_id : body.course_batch_id , batch_sem_id : body.batch_sem_id,
            section_id : body.section_id  
        }) 
         
        let specialClassAvailSec = []

        if(checkSepicalClassAvailForSec.confirm ){

            console.log("session is not found so we create the special class for given section and time frame")

        }else if(!checkSepicalClassAvailForSec.confirm ){ 

            
            for (let index = 0; index < checkSepicalClassAvailForSec.data.length; index++) {
                const element = checkSepicalClassAvailForSec.data[index];   
                specialClassAvailSec.push(element.section_id ) 
            }
            
        }  
        
        return res.send(checkSepicalClassAvailForSec);
        if(!isEmpty(specialClassAvailSec)){
            return ReE(res, { message: `special class already exits for this time frame for section ${specialClassAvailSec}!.` }, BAD_REQUEST); 
        }

    }else{
            
        if(isNull(body.session_start_time)){
            return ReE(res, { message: "Please enter the session start time" }, BAD_REQUEST);
        }

        if (!body.session_start_time || typeof body.session_start_time !== "string") {
            return ReE(res, { message: 'time frame session start time must be a string' } , BAD_REQUEST);
        }

        if (`${new Date(`${todays()} ${body.session_start_time}`)}` === "Invalid Date") {
            return ReE(res, { message: 'Invalid session start time' } , BAD_REQUEST);
        }

        if (!body.session_end_time || typeof body.session_end_time !== "string") {
            return ReE(res, { message: 'time frame session end time must be a string' } , BAD_REQUEST);
        }

        if (`${new Date(`${todays()} ${body.session_end_time}`)}` === "Invalid Date") {
            return ReE(res, { message: 'Invalid session end time' } , BAD_REQUEST);
        }

        if(isNull(body.session_end_time)){
            return ReE(res, { message: "Please enter the session end time" }, BAD_REQUEST);
        } 

        let sessionStartTime = moment(body.session_start_time, "HH:mm") ;
        let sessionEndTime = moment(body.session_end_time, "HH:mm") ;
        let sessionDate = moment(body.session_date).format("YYYY-MM-DD");  
        let duration = moment.duration(moment(sessionEndTime._d).diff(sessionStartTime._d)); 

        if (duration.asMinutes() <= 10 || duration.asMinutes() > 75) {
            return ReE(res, { message: "Time frame start and end time duration must within 10 to 75 minutes!." }, BAD_REQUEST);
        }else{
            body.duration = duration.asMinutes()
        }
  
        if(Array.isArray(body.section_id)){
            
            if(isEmpty(body.section_id)){
                return ReE(res, { message: "Please select the section" }, BAD_REQUEST);
            }

            let checkSectionAvailability, errInSetionAvail= [] , serverError = [] ;

            checkSectionAvailability  = await checkSpeClassAvaiForThisTimeForSec({session_date : sessionDate , session_start_time : body.session_start_time , session_end_time : body.session_end_time , org_id : body.org_id , discipline_id : body.discipline_id , program_id : body.program_id , cdm_id : body.cdm_id , course_batch_id : body.course_batch_id , batch_sem_id : body.batch_sem_id  })

            if(!checkSectionAvailability.success){
                serverError.push(checkSectionAvailability.message)
            } 

            if(!isEmpty(checkSectionAvailability.data) && checkSectionAvailability.data.length !== 0){ 
                for (let index = 0; index < checkSectionAvailability.data.length; index++) {
                    const element = checkSectionAvailability.data[index];    
                    element.section_id.forEach(async item => {   
                        if(body.section_id.includes(item)){    
                            errInSetionAvail.push(  item ) ;
                        }   
                    });  
                } 
            }  

            if(!isEmpty(errInSetionAvail)){
                return ReE(res, { message: `section already exits for this time ${errInSetionAvail}!.` }, BAD_REQUEST); 
            } 

        }
        
    } 

    if(body.faculty_id){

        if (!IsValidUUIDV4(body.faculty_id)) {
            return ReE(res, { message: 'Please select vaild faculty!.' }, BAD_REQUEST)
        }

        let checkSubjectTeachByFaculty = await checkSubjectTeachByUser({ faculty_id: body.faculty_id , subject_id : body.subject_id });
    
        if(!checkSubjectTeachByFaculty.success){
            return ReE(res, { message: checkSubjectTeachByFaculty.message }, BAD_REQUEST)
        }

        let checkFacultyAvailabilityForThisTime , optionFacultyAvailability = {
            org_id: body.org_id ,
            after_complete_all_session : body.after_complete_all_session, 
            faculty_id: body.faculty_id , 
            session_date : body.session_date , 
            session_start_time : body.session_start_time , 
            session_end_time : body.session_end_time , 
            time_frame_id : body.time_frame_id ,
        }
            
        checkFacultyAvailabilityForThisTime = await checkFacultyAvailability(optionFacultyAvailability ); 

        console.log("checkFacultyAvailabilityForThisTime",checkFacultyAvailabilityForThisTime);

        if(!checkFacultyAvailabilityForThisTime.success){
            return ReE(res, { message: checkFacultyAvailabilityForThisTime.message }, BAD_REQUEST)
        } 
    }
 
    let code;

    const data = async () => {

        let sessionId = `SPCCLS-${moment(body.sessionDate).format("YYYY-MM-DD")}-`;

        code = generateCode(sessionId, 5, 10);

        if (String(code).length < 5) {
            data();
        } else {
            let checkCode, codeOption = {
                sessionId: code,
                [Op.or]: [{ is_active: true, is_block: false }, { is_active: true, is_block: true }]
            };

            [err, checkCode] = await to(special_class.findOne({
                where: codeOption
            }));

            console.log("checkCode",checkCode);

            if (!isNull(checkCode)) { 
                data();
            }  

        }
    }

    data();

    body = {
        ...body,
        session_date :  moment(body.session_date).format("YYYY-MM-DD")  ,
        file_path : "",
        session_id: code,
        class_type:"special_class", 
        started : false,
        is_active : true,
        is_block : false,
        timezone:"asia",
    }

    let added 

    // [err, added]= await to(special_class.create(body));

    if(err){ 
        return ReE(res, err, INTERNAL_SERVER_ERROR);
    }

    return ReS(res, { message: "special class verified and added successfully" }, OK);

}