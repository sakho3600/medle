import React, { useState } from "react"
import PropTypes from "prop-types"
import moment from "moment"
import { Alert, Col, Container, FormFeedback, Input, Row } from "reactstrap"
import { withAuthentication, getCurrentUser } from "../utils/auth"
import { EMPLOYMENT_CONSULTATION } from "../utils/roles"

import Layout from "../components/Layout"
import AccordionEmploymentsMonth, {
   hasErrors,
   fetchDataMonth,
   updateDataMonth,
} from "../components/AccordionEmploymentsMonth"
import { Title1, Title2, Label, ValidationButton } from "../components/StyledComponents"
import { isEmpty } from "../utils/misc"

const FillEmploymentsPage = ({
   currentMonth,
   currentMonthName,
   error,
   dataMonth: _dataMonth,
   allMonths,
   year,
   currentUser,
}) => {
   const [errors, setErrors] = useState(error)
   const [success, setSuccess] = useState("")

   const [dataMonth, setDataMonth] = useState(_dataMonth)

   const { hospitalId } = currentUser

   const previousMonths = allMonths && allMonths.length ? allMonths.slice(1) : []

   const handleChange = e => {
      e.preventDefault()

      setDataMonth({ ...dataMonth, [e.target.name]: e.target.value.trim() })
   }

   const update = async monthNumber => {
      setErrors({})

      const errors = hasErrors(dataMonth)

      if (!isEmpty(errors)) {
         setErrors({ ...errors, general: "Erreur de saisie" })
         return
      }

      try {
         await updateDataMonth({ hospitalId, year, month: monthNumber, dataMonth })

         setSuccess("Vos informations ont bien été enregistrées.")
      } catch (error) {
         console.error(error)
         setErrors({ general: "Erreur lors de la mise à jour des ETP" })
      }
   }

   return (
      <Layout page="fillEmployments" currentUser={currentUser}>
         <Title1 className="mt-5 mb-5">{"Déclaration du personnel"}</Title1>
         <Container style={{ maxWidth: 720 }}>
            <Title2 className="mb-4 text-capitalize">{currentMonthName}</Title2>

            <p className="font-italic text-center mb-0">
               {"Veuillez indiquer le nombre d'ETP pour les différents profils de votre UMJ."}
            </p>
            <p className="text-center mb-5">
               <small>
                  Les prochains mois, ces données seront pré-remplies et modifiables. Leur exactitude reste sous votre
                  responsabilité.
               </small>
            </p>

            {!isEmpty(errors) && <Alert color="danger">{errors.general || "Erreur en base de données"}</Alert>}

            {success && <Alert color="primary">{success}</Alert>}

            <>
               <Row>
                  <Col className="mr-3">
                     <Label htmlFor="doctors">Médecin</Label>
                     <Input
                        name="doctors"
                        invalid={errors && !!errors.doctors}
                        placeholder="Nombre d'ETP"
                        value={(dataMonth && dataMonth["doctors"]) || ""}
                        onChange={event => handleChange(event, currentMonth)}
                        autoComplete="off"
                     />
                     <FormFeedback>{errors && errors.doctors}</FormFeedback>
                  </Col>
                  <Col className="mr-3">
                     <Label htmlFor="secretaries">Secrétaire</Label>
                     <Input
                        name="secretaries"
                        invalid={errors && !!errors.secretaries}
                        placeholder="Nombre d'ETP"
                        value={(dataMonth && dataMonth["secretaries"]) || ""}
                        onChange={event => handleChange(event, currentMonth)}
                        autoComplete="off"
                     />
                     <FormFeedback>{errors && errors.secretaries}</FormFeedback>
                  </Col>
                  <Col className="mr-3">
                     <Label htmlFor="nursings">Aide soignant.e</Label>
                     <Input
                        name="nursings"
                        invalid={errors && !!errors.nursings}
                        placeholder="Nombre d'ETP"
                        value={(dataMonth && dataMonth["nursings"]) || ""}
                        onChange={event => handleChange(event, currentMonth)}
                        autoComplete="off"
                     />

                     <FormFeedback>{errors && errors.nursings}</FormFeedback>
                  </Col>
                  <Col className="mr-3">
                     <Label htmlFor="executives">Cadre de santé</Label>
                     <Input
                        name="executives"
                        invalid={errors && !!errors.executives}
                        placeholder="Nombre d'ETP"
                        value={(dataMonth && dataMonth["executives"]) || ""}
                        onChange={event => handleChange(event, currentMonth)}
                        autoComplete="off"
                     />
                     <FormFeedback>{errors && errors.executives}</FormFeedback>
                  </Col>
               </Row>
               <Row className={"mt-2"}>
                  <Col className="mr-3">
                     <Label htmlFor="ides">IDE</Label>
                     <Input
                        name="ides"
                        invalid={errors && !!errors.ides}
                        placeholder="Nombre d'ETP"
                        value={(dataMonth && dataMonth["ides"]) || ""}
                        onChange={event => handleChange(event, currentMonth)}
                        autoComplete="off"
                     />
                     <FormFeedback>{errors && errors.ides}</FormFeedback>
                  </Col>
                  <Col className="mr-3">
                     <Label htmlFor="auditoriumAgents">{"Agent d'amphithéâtre"}</Label>
                     <Input
                        name="auditoriumAgents"
                        invalid={errors && !!errors.auditoriumAgents}
                        placeholder="Nombre d'ETP"
                        value={(dataMonth && dataMonth["auditoriumAgents"]) || ""}
                        onChange={event => handleChange(event, currentMonth)}
                        autoComplete="off"
                     />
                     <FormFeedback>{errors && errors.auditoriumAgents}</FormFeedback>
                  </Col>
                  <Col className="mr-3">
                     <Label htmlFor="psychologists">Psychologue</Label>
                     <Input
                        name="psychologists"
                        invalid={errors && !!errors.psychologists}
                        placeholder="Nombre d'ETP"
                        value={(dataMonth && dataMonth["psychologists"]) || ""}
                        onChange={event => handleChange(event, currentMonth)}
                        autoComplete="off"
                     />
                     <FormFeedback>{errors && errors.psychologists}</FormFeedback>
                  </Col>
                  <Col className="mr-3">
                     <Label htmlFor="others">Autres</Label>
                     <Input
                        name="others"
                        invalid={errors && !!errors.others}
                        placeholder="Nombre d'ETP"
                        value={(dataMonth && dataMonth["others"]) || ""}
                        onChange={event => handleChange(event, currentMonth)}
                        autoComplete="off"
                     />
                     <FormFeedback>{errors && errors.others}</FormFeedback>
                  </Col>
               </Row>

               <div className="text-center mt-5">
                  <ValidationButton color="primary" size="lg" className="center" onClick={() => update(currentMonth)}>
                     Valider
                  </ValidationButton>
               </div>

               <Title2 className="mt-5 mb-4">{"Mois précédents"}</Title2>

               {previousMonths.map(({ monthName, month }) => (
                  <AccordionEmploymentsMonth
                     key={month}
                     monthName={monthName}
                     month={month}
                     year={year}
                     hospitalId={hospitalId}
                     onChange={event => handleChange(event, month)}
                     update={update}
                  />
               ))}
            </>
         </Container>
      </Layout>
   )
}

FillEmploymentsPage.getInitialProps = async ctx => {
   const { hospitalId } = getCurrentUser(ctx)

   if (!hospitalId) {
      return { error: "Vous n'avez pas d'établissement de santé à gérer." }
   }

   const NAME_MONTHS = {
      "01": "janvier",
      "02": "février",
      "03": "mars",
      "04": "avril",
      "05": "mai",
      "06": "juin",
      "07": "juillet",
      "08": "août",
      "09": "septembre",
      "10": "octobre",
      "11": "novembre",
      "12": "décembre",
   }

   const currentMonth = moment().format("MM")
   const currentYear = moment().format("YYYY")

   const allMonths = new Array(parseInt(currentMonth))
      .fill(0)
      .map((_, index) => (index + 1).toString().padStart(2, "0"))
      .reverse()
      .map(elt => ({ monthName: NAME_MONTHS[elt] + " " + currentYear, month: elt }))

   try {
      const json = await fetchDataMonth({ hospitalId, year: currentYear, month: currentMonth })

      return {
         currentMonth,
         currentMonthName: NAME_MONTHS[currentMonth] + " " + currentYear,
         dataMonth: json,
         allMonths,
         year: currentYear,
      }
   } catch (error) {
      console.error(error)
      return {
         error: "Erreur en base de données",
         currentMonth,
         currentMonthName: NAME_MONTHS[currentMonth] + " " + currentYear,
         allMonths,
         year: currentYear,
      }
   }
}

FillEmploymentsPage.propTypes = {
   currentMonth: PropTypes.string,
   currentMonthName: PropTypes.string,
   dataMonth: PropTypes.object,
   allMonths: PropTypes.array,
   error: PropTypes.string,
   // hospitalId: PropTypes.string.isRequired,
   year: PropTypes.string.isRequired,
   currentUser: PropTypes.object.isRequired,
}

FillEmploymentsPage.defaultProps = {
   dataMonth: {},
}

export default withAuthentication(FillEmploymentsPage, EMPLOYMENT_CONSULTATION)
