const { isNull, to, ReE, isEmpty } = require("../service/util.service");
const HttpStatus = require('http-status');
const { getQuery, IsValidUUIDV4 } = require("../service/validation");
const { menu, user_data, user_info,time_table, time_day,special_class , time_frame, organization, discipline, department, user_subject, subject, program, role, role_menu_mapping, course_department_mapping, group, course_batch, section, kode_role, batch_sem } = require('../models');
const { Op, where } = require("sequelize");
const { checkSubject } = require("./subject");
const { CONFIG } = require("../config/confifData");
const { checkProgram } = require("./program");
const { checkTimeFrame } = require("./time_frame");
const moment = require('moment');
const { checkCourseDepart } = require("./course_department_mapping"); 
const { checkBatchSemester } = require("./batch_sem");
const { checkSection } = require("./section");

const checkMenu = async (body) => {

    if (isNull(body.menuId)) {
        return { message: "Please select menu!.", success: false };
    }

    let err;

    let checkMenuDetails, optionMenu = {
        where: getQuery(body),
        include: [{
            model: user_data,
            as: 'createdBy',
            attributes: ['_id', 'username']
        },
        {
            model: user_data,
            as: 'updatedBy',
            attributes: ['_id', 'username']
        }]
    };

    optionMenu.where = {
        ...optionMenu.where,
        _id: body.menuId
    };

    if (!isNull(body.limit) && !isNaN(body.limit)) {
        optionMenu = {
            ...optionMenu,
            limit: Number(body.limit)
        };
    }

    if (!isNull(body.page) && !isNaN(body.page)) {
        optionMenu = {
            ...optionMenu,
            offset: (Number(body.page) * Number(body.page - 1))
        };
    }

    if (!isNull(body.user)) {
        let userF = false;
        if (!isNull(body.user)) {
            if (body.user !== false && body.user !== true) {
                return { message: "Please select vaild menu user fields data!.", success: false };
            }

            userF = body.user;
        }

        optionMenu.where = {
            ...optionMenu.where,
            user: userF
        }
    }

    [err, checkMenuDetails] = await to(menu.findOne(optionMenu));

    if (err) {
        return { message: err, success: false };
    }

    if (isNull(checkMenuDetails)) {
        return { message: "Menus was not found!.", success: false };
    }

    if (!isNull(checkMenuDetails)) {
        return { message: "Menus was exists!", checkMenu: checkMenuDetails, success: true };
    }
};

const checkOrganization = async (body) => {

    if (isNull(body.org_id) || !IsValidUUIDV4(body.org_id)) {
        return { message: "Please select Institution details!.", success: false };
    }

    let checkOrganizationDetails, optionOrganization = {
        where: {
            _id: body.org_id,
            is_active: true
        }
    };

    [err, checkOrganizationDetails] = await to(organization.findOne(optionOrganization))

    if (err) {
        return { message: err, success: false };
    }

    if (isNull(checkOrganizationDetails)) {
        return { message: "Please select vaild institution details!.", success: false };
    }

    if (checkOrganizationDetails.is_block) {
        return { message: "Institution details was blocked!.", success: false };
    }

    if (!isNull(checkOrganizationDetails)) {
        return { message: "Institution was fetched!.", organizationDetails: checkOrganizationDetails, success: true };
    }
}

const checkDiscipline = async (body) => {
 

    if (isNull(body.discipline_id) || !IsValidUUIDV4(body.discipline_id)) {
        return { message: "Please select discipline details!.", success: false };
    }

    let checkDisciplineDetails, optionDiscipline = {
        where: {
            _id: body.discipline_id,
            is_active: true
        }
    };

    if (!isNull(body.org_id)) {
        let organizationDetails = await checkOrganization({ org_id: body.org_id });

        if (!organizationDetails.success) {
            return { message: "Please select vaild Institution details!.", success: false };
        }

        optionDiscipline.where = {
            ...optionDiscipline.where,
            org_id: body.org_id
        }
    }

    [err, checkDisciplineDetails] = await to(discipline.findOne(optionDiscipline))

    if (err) {
        return { message: err, success: false };
    }

    if (isNull(checkDisciplineDetails)) {
        return { message: "Please select discipline details!.", success: false };
    }

    if (checkDisciplineDetails.is_block) {
        return { message: "Discipline details was blocked!.", success: false };
    }

    if (!isNull(checkDisciplineDetails)) {
        return { message: "Discipline was fetched!.", groupDetails: checkDisciplineDetails, success: true };
    }
}

const checkUserInf = async (body) => {
    let err;
    if (isNull(body.user_id) || !IsValidUUIDV4(body.user_id)) {
        return { message: "Please select user details!.", success: false };
    }

    let userInfo, optionUserInfo = {
        where: getQuery(body),
        include: [
            {
                model: user_data,
                as: 'userId',
                attributes: ['_id', 'username']
            },
            {
                model: group,
                as: 'groupId'
            },
            {
                model: organization,
                as: 'orgId',
                attributes: ['_id', 'org_name', 'org_id', 'sortname', 'logo', 'url']
            },
            {
                model: discipline,
                as: 'disciplineId',
                attributes: ['_id', 'name', 'discipline_id', 'logo', 'description']
            },
            {
                model: department,
                as: 'departmentId',
                attributes: ['_id', 'name', 'department_id', 'logo', 'description']
            },
            {
                model: program,
                as: 'programId',
                attributes: ['_id', 'name', 'program_id', 'logo', 'description']
            },
            {
                model: course_batch,
                as: 'courseBatchId',
                attributes: ['_id', 'cdm_id', 'from', 'to', 'code', 'current_sim'],
                include: [{ model: batch_sem, as: 'currentSim' }]
            },
            {
                model: course_department_mapping,
                as: 'cdmId',
                attributes: ['_id', 'name', 'course_duration_id', 'code', 'total_year', 'course_sem_duration_id', 'department_id', 'course_id']
            },
            {
                model: role,
                as: 'roleId',
                attributes: ['_id', 'name', 'org_id', 'code']
            },
            {
                model: section,
                as: 'sectionId',
                attributes: ['_id', 'name', 'course_batch_id', 'cdm_id']
            },
            {
                model: user_data,
                as: 'createdBy',
                attributes: ['_id', 'username']
            },
            {
                model: user_data,
                as: 'updatedBy',
                attributes: ['_id', 'username']
            }],

    };

    if (!isNull(body.limit) && !isNaN(body.limit)) {
        optionUserInfo = {
            ...optionUserInfo,
            limit: Number(body.limit)
        };
    }

    if (!isNull(body.page) && !isNaN(body.page)) {
        optionUserInfo = {
            ...optionUserInfo,
            offset: (Number(body.page) * Number(body.page - 1))
        };
    }

    if (body.type && body.type === 'sdk') {
        optionUserInfo = {
            ...optionUserInfo,
            attributes: {
                exclude: [
                    'discipline_id',
                    'cdm_id',
                    'program_id',
                    'group_id',
                    'department_id',
                    'org_id',
                    'section_id',
                    'role_id',]
            }
        }
    }

    optionUserInfo.where = {
        ...optionUserInfo.where,
        user_id: body.user_id
    };

    [err, userInfo] = await to(user_info.findOne(optionUserInfo));

    if (err) {
        return { message: err, success: false };
    }

    if (isNull(userInfo)) {
        return { message: "User details was not found.", success: false };
    }

    if (userInfo.is_block) {
        return { message: "User details was blocked!.", success: false }
    }

    if (!isNull(userInfo)) {
        return { message: "User details was found.", success: true, userInfo };
    }

}

const checkUser = async (body) => {
    if (isNull(body.user_id) || !IsValidUUIDV4(body.user_id)) {
        return { message: "Please select user details!.", success: false };
    }

    let err;

    let checkUserDetails, optionUser = {
        where: {
            _id: body.user_id,
            is_active: true
        }
    };

    [err, checkUserDetails] = await to(user_data.findOne(optionUser));

    if (err) {
        return { message: err, success: false };
    }

    if (isNull(checkUserDetails)) {
        return { message: "User not found!.", success: false };
    }

    if (checkUserDetails.is_block) {
        return { message: "User was block!.", success: false };
    }

    if (!isNull(checkUserDetails)) {
        return { message: "User was fetched!.", user: checkUserDetails, success: true };
    }
}

const getAllMappedFacultybySubject = async (body) => {

    if (isNull(body.subject_id) || !IsValidUUIDV4(body.subject_id)) {
        return { message: "Please select subject details!.", success: false };
    }

    let query = {
        where: getQuery(body),
        include: [
            {
                model: department,
                as: 'departmentId'
            },
            {
                model: subject,
                as: 'subjectId'
            },
            {
                model: user_data,
                as: 'userId',
                attributes: ['_id', 'username']
            },
            {
                model: user_data,
                as: 'createdBy',
                attributes: ['_id', 'username']
            },
            {
                model: user_data,
                as: 'updatedBy',
                attributes: ['_id', 'username']
            }
        ]
    };

    if (!isNull(body.limit) && !isNaN(body.limit)) {
        query = {
            ...query,
            limit: Number(body.limit)
        };
    }

    if (!isNull(body.page) && !isNaN(body.page)) {
        query = {
            ...query,
            offset: (Number(body.page) * Number(body.page - 1))
        };
    }


    let checkSubjectDetails = await checkSubject({ subject_id: body.subject_id });

    if (!checkSubjectDetails.success) {
        return { message: checkSubjectDetails.message, success: false };
    }

    query.where = {
        ...query.where,
        subject_id: body.subject_id
    };

    let existSubjects;

    [err, existSubjects] = await to(user_subject.findAll(query));

    if (err) {
        return { message: err, success: false };
    }

    if (isEmpty(existSubjects)) {
        return { message: "User mapped subject was empty!.", userSubject: existSubjects, success: true };
    }

    if (!isEmpty(existSubjects)) {
        return { message: "User mapped subject was fetched!.", userSubject: existSubjects, success: true };
    }
}

const checkUserSubject = async (body) => {

    if (isNull(body.subject_id) && isNull(body.user_id)) {
        return { message: "Please select user or subject details!.", success: false }
    }

    if (!isNull(body.user_id)) {
        if (!IsValidUUIDV4(body.user_id)) {
            return { message: "Please select user details!.", success: false }
        }
    }

    if (!isNull(body.subject_id)) {
        if (!IsValidUUIDV4(body.subject_id)) {
            return { message: "Please select subject details!.", success: false }
        }
    }

    let query = {
        where: getQuery(body),
        include: [
            {
                model: department,
                as: 'departmentId'
            },
            {
                model: subject,
                as: 'subjectId'
            },
            {
                model: user_data,
                as: 'userId',
                attributes: ['_id', 'username']
            },
            {
                model: user_data,
                as: 'createdBy',
                attributes: ['_id', 'username']
            },
            {
                model: user_data,
                as: 'updatedBy',
                attributes: ['_id', 'username']
            }
        ]
    };

    if (!isNull(body.limit) && !isNaN(body.limit)) {
        query = {
            ...query,
            limit: Number(body.limit)
        };
    }

    if (!isNull(body.page) && !isNaN(body.page)) {
        query = {
            ...query,
            offset: (Number(body.page) * Number(body.page - 1))
        };
    }

    if (!isNull(body.user_id)) {

        query.where = {
            ...query.where,
            user_id: body.user_id
        };
    }


    if (!isNull(body.subject_id)) {
        let checkSubjectDetails = await checkSubject({ subject_id: body.subject_id });

        if (!checkSubjectDetails.success) {
            return { message: checkSubjectDetails.message, success: false };
        }

        query.where = {
            ...query.where,
            subject_id: body.subject_id
        };
    }

    let existSubjects;

    [err, existSubjects] = await to(user_subject.findOne(query));

    if (err) {
        return { message: err, success: false };
    }

    if (isNull(existSubjects)) {
        return { message: "Subject was not mapped to this user!.", success: false }
    }

    if (!isNull(existSubjects)) {
        return { message: "subject was fetched!.", success: true };
    }

}


const checkMenuAccess = async (body) => {

    let err;

    let checkUserInfo = await checkUserInf({ user_id: body.user_id });

    if (!checkUserInfo.success) {
        return { message: checkUserInfo.message, success: false };
    }

    if (isNull(body.menuId) || !IsValidUUIDV4(body.menuId)) {
        return { message: "Please select vaild menu!.", success: false };
    }

    let getRoleMenus, optionRoleMenus = {
        where: getQuery(body),
        include: [
            {
                model: menu,
                as: 'menuDetails',
                attributes: ['_id', 'name', 'label', 'user']
            },
            {
                model: role,
                as: 'roleDetails',
                attributes: ['_id', 'name']
            },
            {
                model: kode_role,
                as: 'refRoleDetails',
                attributes: ['_id', 'name']
            },
            {
                model: user_data,
                as: 'createdBy',
                attributes: ['_id', 'username']
            },
            {
                model: user_data,
                as: 'updatedBy',
                attributes: ['_id', 'username']
            }
        ]
    };

    if (!isNull(body.limit) && !isNaN(body.limit)) {
        optionRoleMenus = {
            ...optionRoleMenus,
            limit: Number(body.limit)
        };
    }

    if (!isNull(body.page) && !isNaN(body.page)) {
        optionRoleMenus = {
            ...optionRoleMenus,
            offset: (Number(body.page) * Number(body.page - 1))
        };
    }

    if (checkUserInfo.userInfo && checkUserInfo.userInfo.org_id) {
        optionRoleMenus.where = {
            ...optionRoleMenus.where,
            org_id: checkUserInfo.userInfo.org_id,
            role_id: checkUserInfo.userInfo.role_id,
            menu_id: body.menuId,
        }
    } else {
        optionRoleMenus.where = {
            ...optionRoleMenus.where,
            role_id: checkUserInfo.userInfo.role_id,
            menu_id: body.menuId,
        }
    }

    [err, getRoleMenus] = await to(role_menu_mapping.findOne(optionRoleMenus));

    if (err) {
        return { message: err, success: false }
    }

    if (isNull(getRoleMenus)) {
        return { message: "You not allow to access this menu!.", success: false };
    }

    if (!isNull(body.access)) {
        let accessInvaild = await CONFIG.access.filter(x => (getRoleMenus.access[x] == true));

        if (accessInvaild.length == 0) {
            return { message: "You don't have any access on this menu!.", success: false };
        }

        let exist = accessInvaild.filter(x => body.access[x] == true);

        if (isEmpty(exist)) {
            return { message: `You don't have ${exist.map(x => `${x} `)} access on this menu!.`, success: false };
        }

    }

    let data = body.body;

    let fields = ['group_id', 'org_id', 'discipline_id', 'department_id', 'program_id', 'cdm_id', 'course_batch_id', 'section_id'];

    await fields.map(x => {
        if (checkUserInfo.userInfo[x]) {
            if ((x == 'org_id' && isNull(data.group_id)) || (x != 'org_id')) data[x] = checkUserInfo.userInfo[x]
        }
    });

    if (!isNull(data.group_id)) {
        let checkGroupDetails, optionGroup = {
            where: {
                _id: data.group_id,
                is_active: true
            }
        };

        [err, checkGroupDetails] = await to(group.findOne(optionGroup));

        if (err) {
            return { message: err, success: false };
        }

        if (isNull(checkGroupDetails)) {
            return { message: "Group not found!.", success: false };
        }

        if (checkGroupDetails.is_block) {
            return { message: "Group was blocked!.", success: false };
        }

        if (!isNull(body.body.org_id)) {
            let checkOrganizationDetails, optionOrganization = {
                where: {
                    _id: body.body.org_id,
                    group_id: data.group_id,
                    is_active: true
                }
            };

            [err, checkOrganizationDetails] = await to(organization.findOne(optionOrganization));

            if (err) {
                return { message: err, success: false };
            }

            if (isNull(checkOrganizationDetails)) {
                return { message: "Group Organization not found!.", success: false }
            }

            if (checkOrganizationDetails.is_block) {
                return { message: "Group Organization was blocked!.", success: false }
            }

            data.org_id = body.body.org_id;
        }
    }

    if (!isNull(getRoleMenus)) {
        return { message: "Menu was fetched !.", role_menu: getRoleMenus, body: data, userInfo: checkUserInfo.userInfo, success: true };
    }

}

const checkTimeFrameWithDisciplineProgram = async (body) => {
    let err, timeFrame, query = { where: { is_active: true } };
  
  
    if (isNull(body.time_frame_id)   && !IsValidUUIDV4(body.time_frame_id)) {
      return { message: 'Please select vaild time frame details', success: false };
    }
  
    if (!isNull(body.org_id)) {
      let checkOrganizationDetails = await checkOrganization({ org_id: body.org_id });
  
      if (!checkOrganizationDetails.success) {
        return { message: checkOrganizationDetails.message, success: false };
      }
  
      query.where = {
        ...query.where,
        org_id: body.org_id
      }
    }
  
    if (!isNull(body.discipline_id)) {
      let checkOrganizationDetails = await checkDiscipline({ discipline_id : body.discipline_id });
  
      if (!checkOrganizationDetails.success) {
        return { message: checkOrganizationDetails.message, success: false };
      }
  
      query.where = {
        ...query.where,
        discipline_id: body.discipline_id
      }
    }
  
  
    if (!isNull(body.program_id)) {
      let checkOrganizationDetails = await checkProgram({ program_id : body.program_id, discipline_id : body.discipline_id });
  
      if (!checkOrganizationDetails.success) {
        return { message: checkOrganizationDetails.message, success: false };
      }
  
      query.where = {
        ...query.where,
        program_id: body.program_id
      }
    }
  
    if (Array.isArray(body.time_frame_id)) {
      query.where = {
        ...query.where,
        _id: { [Op.in]: body.time_frame_id }
      };
    }
  
    if (IsValidUUIDV4(body.time_frame_id)) {
      query.where = {
        ...query.where,
        _id: body.time_frame_id
      };
    }
  
    let option = {
      where: query.where,
      include: [
        {
          model: organization,
          as: 'orgId'
        },
        {
          model: discipline,
          as: 'disciplineId'
        },
        {
          model: program,
          as: 'programId'
        },
        {
          model: user_data,
          as: 'createdBy'
        },
        {
          model: user_data,
          as: 'updatedBy'
        }
      ],
      order: [['session_end_time', 'ASC']]
    };
  
    if (Array.isArray(body.time_frame_id)) {
  
      [err, timeFrame] = await to(time_frame.findAll(option));
  
      if (err) {
        return { message: err, success: false };
      }
      if (isEmpty(timeFrame)) {
        return { message: "Time Frame not found", success: false };
      }
  
    } else {
  
      [err, timeFrame] = await to(time_frame.findOne(option));
  
      if (err) {
        return { message: err, success: false };
      }
      if (isNull(timeFrame)) {
        return { message: "Time Frame not found", success: false };
      }
  
      if (timeFrame.is_block) {
        return { message: "Time Frame was blocked", success: false };
      }
    }
  
    return { message: "Time Frame founded", data: timeFrame, success: true };
};

const checkSubjectTeachByUser = async (body) => {
    if(body.user_id == "undefined" || body.user_id == "null" || body.user_id == null || body.user_id == undefined){
        body.user_id = body.faculty_id;
    }
    let query = {
        where: getQuery(body),
        include: [
            {
                model: department,
                as: 'departmentId'
            },
            {
                model: subject,
                as: 'subjectId'
            },
            {
                model: user_data,
                as: 'userId',
                attributes: ['_id', 'username']
            },
            {
                model: user_data,
                as: 'createdBy',
                attributes: ['_id', 'username']
            },
            {
                model: user_data,
                as: 'updatedBy',
                attributes: ['_id', 'username']
            }
        ]
    };

    if (!isNull(body.limit) && !isNaN(body.limit)) {
        query = {
            ...query,
            limit: Number(body.limit)
        };
    }

    if (!isNull(body.page) && !isNaN(body.page)) {
        query = {
            ...query,
            offset: (Number(body.page) * Number(body.page - 1))
        };
    }

    if(isNull(body.user_id)){
        return { message: "Please select user details!.", success: false };
    }

    let checkUserDetails = await checkUser({ user_id: body.user_id });

    if (!checkUserDetails.success) {
        return { message: checkUserDetails.message, success: false };
    }
    
    query.where = {
        ...query.where,
        user_id: body.user_id
    };

    if (!isNull(body.subject_id)) {

        let checkSubjectDetails = await checkSubject({ subject_id: body.subject_id });

        if (!checkSubjectDetails.success) {
            return { message: checkSubjectDetails.message, success: false };
        }

        query.where = {
            ...query.where,
            subject_id: body.subject_id
        };

    }

    let existSubjects;

    [err, existSubjects] = await to(user_subject.findOne(query));

    if (err) {
        return { message: err, success: false };
    }

    if (isNull(existSubjects)) {
        return { message: "user does not mapping with this subject", success: false }
    }

    if (!isNull(existSubjects)) {
        return { message: "user subject was fetched!.", success: true };
    }

}

const checkFacultyAvailability = async (body) => {

    if(isNull(body.faculty_id) || !IsValidUUIDV4(body.faculty_id)){
        return { message: "Please select faculty details", success: false };
    } 
    
    if(isNull(body.after_complete_all_session)){
        return { message: "Please select after complete all session", success: false };
    }

    if(body.after_complete_all_session == false){

        if(isNull(body.session_date)){
            return { message: "Please select session date for factulty checking", success: false };
        } 

        let dayOrder = new Date(moment(body.session_date).format("YYYY-MM-DD")).getDay();

        let err , dayFind , dayFindOptions={
            where: {  
                order: dayOrder.toString() , 
                is_active: true, 
                is_block: false, 
            }
        };
        
        [err, dayFind] = await to(time_day.findOne(dayFindOptions)); 

        if (err) {
            return { message: err, success: false };
        }
        
        if (isNull(dayFind)) {
           return { message: "Selected special class date for that day is not found", success: false };
        }
 
         
        let timeTable = [] , timeTableOptions = {
            where: { 
                time_day_id: dayFind._id,
                is_active: true,
                is_block: false,
            },
            include: [
                { model: time_frame, as: "timeFrameId" }, 
                { model: course_batch, as: "courseBatchId" }, 
                { model: course_department_mapping, as: "cdmId" }, 
                { model: section, as: 'sectionId' }
            ]
        };

        
        if (!isNull(body.org_id)) {
            timeTableOptions.where = {
                ...timeTableOptions.where,
                org_id: body.org_id
            }
        }

        if (!isNull(body.time_frame_id)) {
            timeTableOptions.where = {
                ...timeTableOptions.where,
                time_frame_id: body.time_frame_id
            }
        } 

        if (!isNull(body.faculty_id)) {
            timeTableOptions.where = {
                ...timeTableOptions.where,
                user_id: body.faculty_id
            }
        }
    
        [err, timeTable] = await to( time_table.findAll(timeTableOptions) );  

        if (err) { 
            return { message: err , success: false };
        }  

        // let timeFrameDetails , timeTableParticularDetails;

        // if( isNull(body.timeFrameDetails) ){  
            
        //     if(isNull(body.time_frame_id)){
        //         return { message: "Please select time frame details", success: false };
        //     }

        //     let checkTimeFrameOption={
        //         where: { 
        //             is_active: true,
        //             is_block: false,
        //         }
        //     }; 

        //     if (!isNull(body.org_id)) {
        //         checkTimeFrameOption.where = {
        //             ...checkTimeFrameOption.where,
        //             org_id: body.org_id
        //         }
        //     }

        //     if (!isNull(body.discipline_id)) {
        //         checkTimeFrameOption.where = {
        //             ...checkTimeFrameOption.where,
        //             discipline_id: body.discipline_id
        //         }
        //     }

        //     if (!isNull(body.program_id)) {
        //         checkTimeFrameOption.where = {
        //             ...checkTimeFrameOption.where,
        //             program_id: body.program_id
        //         }
        //     }
            
        //     let  checkTimeFrameDetails
        //     console.log("checkTimeFrameOption",checkTimeFrameOption);
        //     [err , checkTimeFrameDetails ]= await to( time_frame.findOne(checkTimeFrameOption));

        //     if (err) {
        //         return { message: err , success: false };
        //     }

        //     if (!checkTimeFrameDetails.success) {
        //         return { message: checkTimeFrameDetails.message, success: false };
        //     }

        //     console.log("trcccccccccccccccccccccccccccccccccccccccccc");
        //     console.log("checkTimeFrameDetails.data",checkTimeFrameDetails  );

        //     timeFrameDetails = checkTimeFrameDetails.data;

        // }else{

        //     timeFrameDetails = body.timeFrameDetails;

        // }

        
        // let find = timeTable.filter(item =>  item.time_frame_id == timeFrameDetails._id) 

        // if(isEmpty(find)){
        //     return { message: "Time frame not found on this time day", success: false };
        // }

        // timeTableParticularDetails = find[0];//filter return array and one object only so we get first object

        // if(timeTableParticularDetails.user_id == body.faculty_id){
        //     return { message: "Faculty not available on this time", success: false };
        // } 

    }else{//after complete all session so we check special class table

        let requireFields = ['session_date', 'session_start_time' , 'session_end_time'];

        let invalidFields = requireFields.filter(x => isNull( body[x]));

        if(!isEmpty(invalidFields)){
            return { message: `${invalidFields.map(x => `${x} `)} fields are required for checking faculty available for after complete all session`, success: false };
        }

        if(isNull(body.org_id)){
            return { message: "Please select org details", success: false };
        }

        let specialClassDetails  

        
 
        [err, specialClassDetails] = await to(special_class.findOne({
            where: { 
                org_id: body.org_id,
                faculty_id: body.faculty_id,
                session_start_time :  body.session_start_time,
                session_end_time : body.session_end_time,
                session_date : moment(body.session_date).format('YYYY-MM-DD'),
            }
        }));

        if (err) {
            return { message: err, success: false };
        }

        if (!isNull(specialClassDetails)) {
            return { message: "Faculty not available on this time", success: false };
        }

    }
    
    return { message: "Faculty available on this time", success: true };

}

const getTimeTableWithFrameMultiSection = async (body) => {
 
    let err;

    if(!Array.isArray(body.section_id)){
        return { message: "Please select section details as array", success: false };
    }
 
    if(isNull(body.time_frame_id) || !IsValidUUIDV4(body.time_frame_id) ){
        return { message: "Please select time frame details", success: false };
    } 

    if(isNull(body.session_date)){
        return { message: "Please select special class date", success: false };
    }  

    let validField = ["org_id", "discipline_id", "program_id", "cdm_id", "course_batch_id", "batch_sem_id"];

    let invalidFields = validField.filter(x => !isNull(body[x]) && !IsValidUUIDV4(body[x]));

    if(!isEmpty(invalidFields)){ 
        let message = `${invalidFields.map(x => `${x} `)} fields are required for to get section based time table`; 
        return { message, success: false }; 
    }

    let dayOrder = new Date(moment(body.session_date).format("YYYY-MM-DD")).getDay();

    let   dayFind , dayFindOptions={
        where: {  
            order: dayOrder.toString() , 
            is_active: true, 
            is_block: false, 
        }
    };
    
    [err, dayFind] = await to(time_day.findOne(dayFindOptions)); 

    if (err) {
        return { message: err, success: false };
    }
    
    if (isNull(dayFind)) {
        return { message: "Selected special class date for that day is not found", success: false };
    }

    let TimeTableDetails , timeTableSectionOptions = {
        where: { 
            is_active: true,
            is_block: false, 
            time_frame_id: body.time_frame_id, 
            time_day_id : dayFind._id,
            current : true,
            active : true,
        },
        include: [ 
            { model: time_frame, as: "timeFrameId" }, 
            { model: section, as: 'sectionId' }
        ]
    } 

    if(!isNull(body.org_id)){

        let checkOrganizationDetails = await checkOrganization({ org_id: body.org_id });

        if (!checkOrganizationDetails.success) {
            return { message: checkOrganizationDetails.message, success: false };
        }

        timeTableSectionOptions.where = {
            ...timeTableSectionOptions.where,
            org_id: body.org_id
        }

    }

    if(!isNull(body.discipline_id)){

        let checkDisciplineDetails = await checkDiscipline({ discipline_id: body.discipline_id });

        if (!checkDisciplineDetails.success) {
            return { message: checkDisciplineDetails.message, success: false };
        }

        timeTableSectionOptions.where = {
            ...timeTableSectionOptions.where,
            discipline_id: body.discipline_id
        }

    }

    if(!isNull(body.program_id)){

        let checkProgramDetails = await checkProgram({ program_id: body.program_id });

        if (!checkProgramDetails.success) {
            return { message: checkProgramDetails.message, success: false };
        }

        timeTableSectionOptions.where = { 
            ...timeTableSectionOptions.where, 
            program_id: body.program_id 
        }

    }

    if(!isNull(body.cdm_id)){

        let checkCdmDetails = await checkCourseDepart({ cdm_id: body.cdm_id });

        if (!checkCdmDetails.success) {
            return { message: checkCdmDetails.message, success: false };
        }

        timeTableSectionOptions.where = { 
            ...timeTableSectionOptions.where, 
            cdm_id: body.cdm_id 
        }

    }

    if(!isNull(body.course_batch_id)){ 
         
        timeTableSectionOptions.where = {
            ...timeTableSectionOptions.where,
            course_batch_id: body.course_batch_id
        }

    }

    if(!isNull(body.batch_sem_id)){

        let checkBatchSemDetails = await checkBatchSemester({ batch_sem_id: body.batch_sem_id });

        if (!checkBatchSemDetails.success) {
            return { message: checkBatchSemDetails.message, success: false };
        }

        timeTableSectionOptions.where = {
            ...timeTableSectionOptions.where,
            batch_sem_id: body.batch_sem_id
        }

    }  

    [err, TimeTableDetails] = await to(time_table.findAll(timeTableSectionOptions));

    if (err) {
        return { message: err, success: false };
    } 
 
    if(isEmpty(TimeTableDetails)){
        return { message: "Time table not found so no session for this section" , success: true ,   confirm : true  }; 
    } 

    let filterTimeTableDetails;

    if(!isEmpty(body.section_id)){
        filterTimeTableDetails = TimeTableDetails.filter(element => body.section_id.includes(element.section_id) );
    }

    if(isEmpty(filterTimeTableDetails)){
        return { message: "Time table not found so no session for this section" , success: true ,   confirm : true  }; 
    }
       
    return { message: "Time table was fetched", data: filterTimeTableDetails, success: true , confirm : false  };

}

const checkSpeClassAvaiForThisTimeForSec = async (body) => { 

    if( !Array.isArray(body.section_id)){
        return { message: "Please select section details in array", success: false };
    }

    let checkSectionAvailability , specialClassOptions = {
        where: { 
            is_active: true,
            is_block: false, 
            session_date: moment(body.session_date).format('YYYY-MM-DD'), 
        }
    } 

    if(!isNull(body.session_start_time)){
        specialClassOptions.where = {
            ...specialClassOptions.where,
            session_start_time: body.session_start_time
        }
    }

    if(!isNull(body.session_end_time)){
        specialClassOptions.where = {
            ...specialClassOptions.where,
            session_end_time: body.session_end_time
        }
    }

    if(!isNull(body.org_id)){

        let checkOrganizationDetails = await checkOrganization({ org_id: body.org_id });

        if (!checkOrganizationDetails.success) {
            return { message: checkOrganizationDetails.message, success: false };
        }

        specialClassOptions.where = {
            ...specialClassOptions.where,
            org_id: body.org_id
        }

    }

    if(!isNull(body.discipline_id)){

        let checkDisciplineDetails = await checkDiscipline({ discipline_id: body.discipline_id });

        if (!checkDisciplineDetails.success) {
            return { message: checkDisciplineDetails.message, success: false };
        }

        specialClassOptions.where = {
            ...specialClassOptions.where,
            discipline_id: body.discipline_id
        }

    }

    if(!isNull(body.program_id)){

        let checkProgramDetails = await checkProgram({ program_id: body.program_id });

        if (!checkProgramDetails.success) {
            return { message: checkProgramDetails.message, success: false };
        }

        specialClassOptions.where = { 
            ...specialClassOptions.where, 
            program_id: body.program_id 
        }

    }

    if(!isNull(body.cdm_id)){

        let checkCdmDetails = await checkCourseDepart({ cdm_id: body.cdm_id });

        if (!checkCdmDetails.success) {
            return { message: checkCdmDetails.message, success: false };
        }

        specialClassOptions.where = { 
            ...specialClassOptions.where, 
            cdm_id: body.cdm_id 
        }

    }

    if(!isNull(body.course_batch_id)){ 
         
        specialClassOptions.where = {
            ...specialClassOptions.where,
            course_batch_id: body.course_batch_id
        }

    }

    if(!isNull(body.batch_sem_id)){

        let checkBatchSemDetails = await checkBatchSemester({ batch_sem_id: body.batch_sem_id });

        if (!checkBatchSemDetails.success) {
            return { message: checkBatchSemDetails.message, success: false };
        }

        specialClassOptions.where = {
            ...specialClassOptions.where,
            batch_sem_id: body.batch_sem_id
        }

    }   

    if(!isNull(body.time_frame_id)){

        let checkBatchSemDetails = await checkTimeFrame({ time_frame_id: body.time_frame_id });

        if (!checkBatchSemDetails.success) {
            return { message: checkBatchSemDetails.message, success: false };
        }

        specialClassOptions.where = {
            ...specialClassOptions.where,
            time_frame_id: body.time_frame_id
        }

    }  

    console.log("specialClassOptions",specialClassOptions);

    [ err , checkSectionAvailability] = await to(special_class.findAll( specialClassOptions ));  

    if(err){
        return { message: err, success: false };
    } 

    if(isEmpty(checkSectionAvailability)){
        return { message: "special class not found so we can create the special class" , success: true , confirm : true  }; 
    }
 
    let filterSectionAvailability = [] , sectionDetails = []  
 
 
    checkSectionAvailability.forEach((section,i) => {
        let count = 0 ; 
        console.log("section.section "+i , section );
        section.section_id.forEach((item,index) => {
            if(body.section_id.includes(item)){
                if(count == 0){
                    filterSectionAvailability.push(section)
                }
                count++
            }
        })
        count = 0 ;
    })

    for (let index = 0; index < filterSectionAvailability.length; index++) {
        const element = filterSectionAvailability[index];
        for (let item = 0; item < element.section_id.length; item++) {
            const element = element.section_id[item];
            let fetchSectionDetails = await checkSection({ section_id: item });
            if(fetchSectionDetails.success){
                sectionDetails.push(fetchSectionDetails.section) ; 
            } 
        }
    }

    
    return  {data : checkSectionAvailability , data2 : sectionDetails } 

    if(isEmpty(filterSectionAvailability)){
        return { message: "special class not found so we can create the special class" , success: true , confirm : true  }; 
    }

    
    return { message: "special class fetched for given section" , data :filterSectionAvailability ,  success: true, confirm : false   }; 

}

module.exports = {
    checkMenu,
    checkOrganization,
    checkDiscipline,
    checkUserInf,
    checkUser,
    getAllMappedFacultybySubject,
    checkUserSubject,
    checkMenuAccess,
    checkTimeFrameWithDisciplineProgram,
    checkSubjectTeachByUser,
    checkFacultyAvailability,
    getTimeTableWithFrameMultiSection,
    checkSpeClassAvaiForThisTimeForSec
}
