import React, { useState } from "react"
import { PropTypes } from "prop-types"
import { Button, ButtonGroup, Container, Form, FormGroup, Input } from "reactstrap"
import fetch from "isomorphic-unfetch"

import {
   API_URL,
   GLOBAL_STATISTICS_ENDPOINT,
   LIVING_STATISTICS_ENDPOINT,
   DEACEASED_STATISTICS_ENDPOINT,
} from "../../config"
import { handleAPIResponse } from "../../utils/errors"
import { METHOD_POST } from "../../utils/http"
import Layout from "../../components/Layout"
import { Label, Title1, ValidationButton } from "../../components/StyledComponents"
import { STATS_GLOBAL } from "../../utils/roles"
import { buildAuthHeaders, redirectIfUnauthorized, withAuthentication } from "../../utils/auth"
import { logError } from "../../utils/logger"
import { pluralize } from "../../utils/misc"
import { StatBlockNumbers, StatBlockPieChart } from "../../components/StatBlock"

// handy skeleton structure to avoid future "undefined" management
const statisticsDefault = {
   inputs: {},
   globalCount: 0,
   averageCount: 0,
   profilesDistribution: {}, // nested object can't be merged in JS so empty object is enough
   actsWithSamePV: 0,
   averageWithSamePV: 0,
   actsWithPv: {},
   actTypes: {},
   hours: {},
   examinations: {},
}

const fetchStatistics = async ({ type = "Global", startDate, endDate, authHeaders }) => {
   const obj = {
      Vivant: LIVING_STATISTICS_ENDPOINT,
      Thanato: DEACEASED_STATISTICS_ENDPOINT,
   }

   const endpoint = obj[type] || GLOBAL_STATISTICS_ENDPOINT

   const response = await fetch(API_URL + endpoint, {
      method: METHOD_POST,
      body: JSON.stringify({ startDate, endDate }),
      headers: { "Content-Type": "application/json", ...authHeaders },
   })

   const statistics = await handleAPIResponse(response)
   return { ...statisticsDefault, ...statistics }
}

const StatisticsPage = ({ statistics: _statistics, currentUser }) => {
   const [statistics, setStatistics] = useState(_statistics)
   const [type, setType] = useState("Global")
   const [state, setState] = useState({
      startDate: statistics.inputs.startDate,
      endDate: statistics.inputs.endDate,
   })

   const livingDeceaseddData = [
      {
         name: "Vivant",
         value: statistics.profilesDistribution.living || 0,
      },
      {
         name: "Thanato",
         value: statistics.profilesDistribution.deceased || 0,
      },
   ]

   const actsWithPvData = [
      {
         name: "Avec",
         value: statistics.actsWithPv.withRequisition || 0,
      },
      {
         name: "Sans (non renseigné)",
         value: statistics.actsWithPv.withoutRequisition || 0,
      },
      {
         name: "Recueil de preuves sans plainte",
         value: statistics.actsWithPv.withoutPlaint || 0,
      },
   ]

   const actTypesData = [
      {
         name: "Somatique",
         value: statistics.actTypes.somatic || 0,
      },
      {
         name: "Psychiatrique",
         value: statistics.actTypes.psychiatric || 0,
      },
   ]

   const hoursData = [
      {
         name: "Journée",
         value: statistics.hours.day || 0,
      },
      {
         name: "Soirée",
         value: statistics.hours.evening || 0,
      },
      {
         name: "Nuit profonde",
         value: statistics.hours.night || 0,
      },
   ]

   const examinationsData = [
      {
         name: "Biologie",
         value: statistics.examinations.biology || 0,
      },
      {
         name: "Imagerie",
         value: statistics.examinations.image || 0,
      },
      {
         name: "Toxicologie",
         value: statistics.examinations.toxicology || 0,
      },
      {
         name: "Anapath",
         value: statistics.examinations.anapath || 0,
      },
      {
         name: "Génétique",
         value: statistics.examinations.genetic || 0,
      },
      {
         name: "Autres",
         value: statistics.examinations.others || 0,
      },
   ]

   const onChange = e => {
      setState({ ...state, [e.target.id]: e.target.value })
   }

   const onSubmit = async e => {
      e.preventDefault()

      const { startDate, endDate } = state
      const statistics = await fetchStatistics({ type, startDate, endDate })
      setState({
         ...state,
         startDate: statistics.inputs.startDate,
         endDate: statistics.inputs.endDate,
      })
      setStatistics(statistics)
   }

   const changeTab = async type => {
      setType(type)
      const statistics = await fetchStatistics({ type, startDate: state.startDate, endDate: state.endDate })
      setState({
         ...state,
         startDate: statistics.inputs.startDate,
         endDate: statistics.inputs.endDate,
      })
      setStatistics(statistics)
   }

   return (
      <Layout page="statistics" currentUser={currentUser}>
         <Title1 className="mt-5 mb-3">{"Statistiques"}</Title1>
         <Container style={{ textAlign: "center" }}>
            <ButtonGroup className="pb-4">
               <Button
                  className="statistics-tab-button"
                  color="primary"
                  onClick={() => changeTab("Global")}
                  outline={type !== "Global"}
               >
                  Global&nbsp;
               </Button>
               <Button
                  className="statistics-tab-button"
                  color="primary"
                  onClick={() => changeTab("Vivant")}
                  outline={type !== "Vivant"}
               >
                  &nbsp;Vivant
               </Button>
               <Button
                  className="statistics-tab-button"
                  color="primary"
                  onClick={() => changeTab("Thanato")}
                  outline={type !== "Thanato"}
               >
                  Thanato
               </Button>
            </ButtonGroup>
            <style jsx global>{`
               .statistics-tab-button.btn-outline-primary:hover {
                  background-color: white !important;
                  color: #0053b3;
               }
            `}</style>
            <br />
            <Form inline className="pb-4 justify-content-center">
               <FormGroup>
                  <Label htmlFor="examinationDate" className="ml-2 mr-2">
                     {"Du"}
                  </Label>
                  <Input
                     id="startDate"
                     type="date"
                     value={state.startDate}
                     // value={state.examinationDate}
                     onChange={onChange}
                     style={{ maxWidth: 150 }}
                  />
               </FormGroup>
               <FormGroup>
                  <Label htmlFor="examinationDate" className="ml-2 mr-2">
                     {"au"}
                  </Label>
                  <Input
                     id="endDate"
                     type="date"
                     value={state.endDate}
                     // value={state.examinationDate}
                     onChange={onChange}
                     style={{ maxWidth: 150 }}
                  />
               </FormGroup>
               <ValidationButton color="primary" size="lg" className="center" onClick={onSubmit}>
                  Go
               </ValidationButton>
            </Form>
            {type === "Global" && (
               <div
                  style={{
                     width: "100%",
                     maxWidth: 1050,
                     display: "flex",
                     flexWrap: "wrap",
                     alignContent: "flex-start",
                  }}
               >
                  <StatBlockNumbers
                     title="Actes réalisés"
                     firstNumber={statistics.globalCount}
                     firstLabel={`Acte${pluralize(statistics.globalCount)} au total (tous confondus).`}
                     secondNumber={statistics.averageCount}
                     secondLabel={`Acte${pluralize(statistics.averageCount)} par jour en moyenne.`}
                  />
                  <StatBlockPieChart
                     data={livingDeceaseddData}
                     hoverTitle="Hors assises et reconstitutions"
                     title="Répartition Vivant/Thanato"
                  />
                  <StatBlockNumbers
                     title="Actes hors examens"
                     firstNumber={statistics.profilesDistribution.reconstitution}
                     firstLabel={`Reconstitution${pluralize(statistics.profilesDistribution.reconstitution)}.`}
                     secondNumber={statistics.profilesDistribution.criminalCourt}
                     secondLabel={`Participation${pluralize(
                        statistics.profilesDistribution.reconstitution,
                     )} aux assises.`}
                  />
                  <StatBlockNumbers
                     title="Réquisitions"
                     firstNumber={statistics.actsWithSamePV}
                     firstLabel={`Acte${pluralize(statistics.actsWithSamePV)} avec le même numéro de réquisition.`}
                     secondNumber={statistics.averageWithSamePV}
                     secondLabel={`Acte${pluralize(
                        statistics.averageWithSamePV,
                     )} par numéro en moyenne sur ces numéros récurrents.`}
                  />
               </div>
            )}
            {type === "Vivant" && (
               <div
                  style={{
                     width: "100%",
                     maxWidth: 1050,
                     display: "flex",
                     flexWrap: "wrap",
                     alignContent: "flex-start",
                  }}
               >
                  <StatBlockNumbers
                     title="Actes réalisés"
                     firstNumber={statistics.globalCount}
                     firstLabel={`Acte${pluralize(statistics.globalCount)} au total (tous confondus).`}
                     secondNumber={statistics.averageCount}
                     secondLabel={`Acte${pluralize(statistics.averageCount)} par jour en moyenne.`}
                  />
                  <StatBlockPieChart data={actsWithPvData} title="Numéro de réquisitions" />
                  <StatBlockPieChart data={actTypesData} title="Types d'actes" />
                  <StatBlockPieChart
                     data={hoursData}
                     title="Horaires"
                     hoverTitle="Journée (8h30-18h30) / Soirée (18h30-00h) / Nuit profonde (00h-8h30)"
                  />
                  <StatBlockPieChart data={examinationsData} title="Examens complémentaires" />
               </div>
            )}
            {type === "Thanato" && (
               <div
                  style={{
                     width: "100%",
                     maxWidth: 1050,
                     display: "flex",
                     flexWrap: "wrap",
                     alignContent: "flex-start",
                  }}
               >
                  <StatBlockNumbers
                     title="Actes réalisés"
                     firstNumber={statistics.globalCount}
                     firstLabel={`Acte${pluralize(statistics.globalCount)} au total (tous confondus).`}
                     secondNumber={statistics.averageCount}
                     secondLabel={`Acte${pluralize(statistics.averageCount)} par jour en moyenne.`}
                  />
               </div>
            )}
         </Container>
      </Layout>
   )
}

StatisticsPage.getInitialProps = async ctx => {
   const authHeaders = buildAuthHeaders(ctx)

   try {
      return { statistics: await fetchStatistics({ authHeaders }) }
   } catch (error) {
      logError(error)
      redirectIfUnauthorized(error, ctx)
   }
}

StatisticsPage.propTypes = {
   statistics: PropTypes.object,
   currentUser: PropTypes.object.isRequired,
}

export default withAuthentication(StatisticsPage, STATS_GLOBAL)