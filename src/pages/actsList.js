import React, { useState } from "react"
import Link from "next/link"
import PropTypes from "prop-types"
import fetch from "isomorphic-unfetch"
import moment from "moment"
import { Alert, Button, Col, Container, Form, FormGroup, Input, Spinner, Table } from "reactstrap"

import { buildAuthHeaders, redirectIfUnauthorized, withAuthentication } from "../utils/auth"
import { API_URL, ACT_SEARCH_ENDPOINT } from "../config"
import { Title1 } from "../components/StyledComponents"
import Pagination from "../components/Pagination"
import Layout from "../components/Layout"
import { VerticalList } from "../components/VerticalList"
import { FORMAT_DATE } from "../utils/date"
import { ACT_CONSULTATION } from "../utils/roles"
import { handleAPIResponse } from "../utils/errors"
import { logError } from "../utils/logger"

const fetchData = async ({ search, requestedPage, authHeaders }) => {
   const arr = []
   if (search) {
      arr.push(`fuzzy=${search}`)
   }
   if (requestedPage) {
      arr.push(`requestedPage=${requestedPage}`)
   }
   const bonus = arr.length ? "?" + arr.join("&") : ""
   const response = await fetch(`${API_URL}${ACT_SEARCH_ENDPOINT}${bonus}`, { headers: authHeaders })

   return handleAPIResponse(response)
}

const defaultPaginatedData = {
   totalCount: 0,
   currentPage: 1,
   maxPage: 1,
   acts: [],
}

const ActsListPage = ({ paginatedData: _paginatedData, currentUser }) => {
   const [search, setSearch] = useState("")
   const [paginatedData, setPaginatedData] = useState(_paginatedData || defaultPaginatedData)
   const [isError, setIsError] = useState()
   const [isLoading, setIsLoading] = useState(false)

   const onChange = e => {
      setSearch(e.target.value)
   }

   const onSubmit = e => {
      e.preventDefault()
      handleSearch()
   }

   const handleSearch = async () => {
      setIsLoading(true)
      setIsError(false)

      try {
         const paginatedData = await fetchData({ search })
         setPaginatedData(paginatedData)
      } catch (error) {
         logError("APP error", error)
         setIsError("Erreur serveur")
      } finally {
         setTimeout(async () => {
            setIsLoading(false)
         }, 500)
      }
   }

   const clickPage = async requestedPage => {
      setIsError(false)

      try {
         const paginatedData = await fetchData({ search, requestedPage })
         setPaginatedData(paginatedData)
      } catch (error) {
         logError("APP error", error)
         setIsError("Erreur serveur")
      }
   }

   return (
      <Layout page="actsList" currentUser={currentUser}>
         <Title1 className="mt-5 mb-4">{"L'activité de votre UMJ/IML"}</Title1>
         <Container style={{ maxWidth: 980 }}>
            <Form onSubmit={onSubmit}>
               <FormGroup row inline className="justify-content-center mb-4">
                  <Col className="ml-auto" sm="9">
                     <Input
                        type="text"
                        name="es"
                        id="es"
                        placeholder="Rechercher un dossier par numéro, type de profil examiné, ..."
                        value={search}
                        onChange={onChange}
                        autoComplete="off"
                     />
                  </Col>
                  <Col sm="3" className="text-center mt-4 mt-sm-0">
                     <Button className="w-lg-75" disabled={isLoading}>
                        {isLoading ? <Spinner size="sm" color="light" data-testid="loading" /> : "Chercher"}
                     </Button>
                  </Col>
               </FormGroup>
            </Form>
            {isError && (
               <Alert color="danger" className="mb-4">
                  {isError}
               </Alert>
            )}
            {!isError && !paginatedData.acts.length && <div className="text-center">{"Aucun actes trouvés."}</div>}

            {!isError && !!paginatedData.acts.length && (
               <>
                  <Pagination data={paginatedData} fn={clickPage} />
                  <Table responsive className="table-hover">
                     <thead>
                        <tr className="table-light">
                           <th>N° dossier interne</th>
                           <th>N° PV</th>
                           <th>Date</th>
                           <th>Type de profil</th>
                           <th>{"Type d'acte"}</th>
                           <th></th>
                        </tr>
                     </thead>
                     <tbody>
                        {paginatedData.acts.map(act => (
                           <tr key={act.id}>
                              <td>
                                 <b>{act.internal_number}</b>
                              </td>
                              <td>{act.pv_number}</td>
                              <td>{act.examination_date && moment(act.examination_date).format(FORMAT_DATE)}</td>
                              <td>{act.profile}</td>
                              <td>{act.extra_data && <VerticalList content={act.extra_data.examinationTypes} />}</td>
                              <td>
                                 <Link href="/actDetail/[id]" as={`/actDetail/${act.id}`}>
                                    <a>Voir&nbsp;&gt;</a>
                                 </Link>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </Table>
               </>
            )}
         </Container>
      </Layout>
   )
}

ActsListPage.getInitialProps = async ctx => {
   const authHeaders = buildAuthHeaders(ctx)

   try {
      const paginatedData = await fetchData({ authHeaders })
      return { paginatedData }
   } catch (error) {
      logError("APP error", error)

      redirectIfUnauthorized(error, ctx)
   }
   return {}
}

ActsListPage.propTypes = {
   paginatedData: PropTypes.object.isRequired,
   currentUser: PropTypes.object.isRequired,
}

export default withAuthentication(ActsListPage, ACT_CONSULTATION)
